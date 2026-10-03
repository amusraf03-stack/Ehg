import fs from 'fs'
import path from 'path'

import {
  createTenderDocument,
  deactivateTenderDocument,
  getTenderDocumentById,
  getTenderDocuments,
  getTenderDocumentSummary,
  updateTenderDocument,
} from '../models/tenderDocumentModel.js'

import { getTenderById } from '../models/tenderModel.js'

import { createTenderActivity } from '../models/tenderActivityModel.js'

import pool from '../config/db.js'

const ALLOWED_DOCUMENT_TYPES = [
  'ORIGINAL_TENDER',
  'INTERNAL_SUBMISSION',
]

const parsePositiveId = (value) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const removePhysicalFile = (filePath) => {
  if (!filePath) return

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(
      'Unable to remove physical document:',
      error.message
    )
  }
}

const getTenderOrFail = async (tenderId) => {
  const tender = await getTenderById(tenderId)

  return tender || null
}

const validateRequirement = async (
  requirementId,
  tenderId
) => {
  if (!requirementId) {
    return true
  }

  const [rows] = await pool.query(
    `
      SELECT id
      FROM tender_requirements
      WHERE id = ?
        AND tender_id = ?
        AND is_active = 1
      LIMIT 1
    `,
    [requirementId, tenderId]
  )

  return rows.length > 0
}

const validateComplianceItem = async (
  complianceItemId,
  tenderId
) => {
  if (!complianceItemId) {
    return true
  }

  const [rows] = await pool.query(
    `
      SELECT id
      FROM tender_compliance_items
      WHERE id = ?
        AND tender_id = ?
        AND is_active = 1
      LIMIT 1
    `,
    [complianceItemId, tenderId]
  )

  return rows.length > 0
}



const getDocumentLinkContext = async ({
  requirementId,
  complianceItemId,
}) => {
  if (requirementId) {
    const [rows] = await pool.query(
      `
        SELECT id, title
        FROM tender_requirements
        WHERE id = ?
        LIMIT 1
      `,
      [requirementId]
    )

    if (rows.length > 0) {
      return {
        linkType: 'REQUIREMENT',
        linkId: rows[0].id,
        linkTitle: rows[0].title,
      }
    }
  }

  if (complianceItemId) {
    const [rows] = await pool.query(
      `
        SELECT id, title
        FROM tender_compliance_items
        WHERE id = ?
        LIMIT 1
      `,
      [complianceItemId]
    )

    if (rows.length > 0) {
      return {
        linkType: 'COMPLIANCE',
        linkId: rows[0].id,
        linkTitle: rows[0].title,
      }
    }
  }

  return {
    linkType: 'TENDER',
    linkId: null,
    linkTitle: null,
  }
}




export const listTenderDocuments = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveId(
      req.params.tenderId
    )

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const tender = await getTenderOrFail(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const [documents, summary] = await Promise.all([
      getTenderDocuments(tenderId),
      getTenderDocumentSummary(tenderId),
    ])

    return res.json({
      success: true,
      count: documents.length,
      summary,
      data: documents,
    })
  } catch (error) {
    console.error(
      'List tender documents error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to load tender documents.',
    })
  }
}

export const uploadTenderDocument = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveId(
      req.params.tenderId
    )

    if (!tenderId) {
      removePhysicalFile(req.file?.path)

      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const tender = await getTenderOrFail(tenderId)

    if (!tender) {
      removePhysicalFile(req.file?.path)

      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a document to upload.',
      })
    }



    const {
      documentType,
      title,
      description,
      requirementId,  
      complianceItemId,
    } = req.body

    if (
      !ALLOWED_DOCUMENT_TYPES.includes(documentType)
    ) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message: 'Invalid document type.',
      })
    }

    // Employees may only upload internal submission documents.
// Original tender documents remain management-controlled.
if (
  req.user.role === 'EMPLOYEE' &&
  documentType !== 'INTERNAL_SUBMISSION'
) {
  removePhysicalFile(req.file.path)

  return res.status(403).json({
    success: false,
    message:
      'Employees can only upload internal submission documents.',
  })
}

    if (!title || !title.trim()) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message: 'Document title is required.',
      })
    }

    const parsedRequirementId = requirementId
      ? parsePositiveId(requirementId)
      : null

    const parsedComplianceItemId = complianceItemId
      ? parsePositiveId(complianceItemId)
      : null

    if (
      requirementId &&
      !parsedRequirementId
    ) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.',
      })
    }

    if (
      complianceItemId &&
      !parsedComplianceItemId
    ) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message: 'Invalid compliance item ID.',
      })
    }

    if (
      parsedRequirementId &&
      parsedComplianceItemId
    ) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message:
          'A document can be linked to either a requirement or a compliance item, not both.',
      })
    }

    const requirementValid =
      await validateRequirement(
        parsedRequirementId,
        tenderId
      )

    if (!requirementValid) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message:
          'The selected requirement does not belong to this tender.',
      })
    }

    const complianceValid =
      await validateComplianceItem(
        parsedComplianceItemId,
        tenderId
      )

    if (!complianceValid) {
      removePhysicalFile(req.file.path)

      return res.status(400).json({
        success: false,
        message:
          'The selected compliance item does not belong to this tender.',
      })
    }


    

    const document = await createTenderDocument({
      tenderId,
      documentType,
      title: title.trim(),
      description:
        description?.trim() || null,

      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,

      fileUrl: null,

      mimeType: req.file.mimetype,
      fileSize: req.file.size,

      requirementId: parsedRequirementId,
      complianceItemId:
        parsedComplianceItemId,

      uploadedBy: req.user.id,
    })

    const linkContext = await getDocumentLinkContext({
  requirementId: parsedRequirementId,
  complianceItemId: parsedComplianceItemId,
})

const isEvidence =
  documentType === 'INTERNAL_SUBMISSION'

const documentLabel = isEvidence
  ? 'evidence'
  : 'source document'

let activityDescription =
  `${isEvidence ? 'Evidence' : 'Source document'} ` +
  `"${req.file.originalname}" was uploaded.`

if (linkContext.linkType === 'REQUIREMENT') {
  activityDescription +=
    ` Linked to requirement "${linkContext.linkTitle}".`
} else if (linkContext.linkType === 'COMPLIANCE') {
  activityDescription +=
    ` Linked to compliance item "${linkContext.linkTitle}".`
} else {
  activityDescription += ' Linked to tender.'
}

await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'DOCUMENT_UPLOADED',
  entityType: 'DOCUMENT',
  entityId: document.id,
  description: activityDescription,
  metadata: {
    documentId: document.id,
    documentType,
    documentLabel,
    title: document.title,
    fileName: req.file.originalname,

    linkType: linkContext.linkType,
    linkId: linkContext.linkId,
    linkTitle: linkContext.linkTitle,

    requirementId: parsedRequirementId,
    complianceItemId: parsedComplianceItemId,
  },
})

    const summary =
      await getTenderDocumentSummary(tenderId)

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      summary,
      data: document,
    })
  } catch (error) {
    removePhysicalFile(req.file?.path)

    console.error(
      'Upload tender document error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to upload tender document.',
    })
  }
}

export const editTenderDocument = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveId(
      req.params.tenderId
    )

    const documentId = parsePositiveId(
      req.params.documentId
    )

    if (!tenderId || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or document ID.',
      })
    }

    const tender = await getTenderOrFail(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const existing =
  await getTenderDocumentById(documentId)

if (
  !existing ||
  Number(existing.tender_id) !== tenderId
) {
  removePhysicalFile(req.file?.path)

  return res.status(404).json({
    success: false,
    message: 'Document not found for this tender.',
  })
}

// --------------------------------------------------
// Employee document edit security
// --------------------------------------------------
// Employees may edit Internal Submission documents only.
// No assignment or uploader ownership check is required.
if (
  req.user.role === 'EMPLOYEE' &&
  existing.document_type !== 'INTERNAL_SUBMISSION'
) {
  removePhysicalFile(req.file?.path)

  return res.status(403).json({
    success: false,
    message:
      'Employees can only edit internal submission documents.',
  })
}

const {
  documentType,
  title,
  description,
  requirementId,
  complianceItemId,
} = req.body

if (
  req.user.role === 'EMPLOYEE' &&
  documentType !== 'INTERNAL_SUBMISSION'
) {
  removePhysicalFile(req.file?.path)

  return res.status(403).json({
    success: false,
    message:
      'Employees cannot change evidence into an original tender document.',
  })
}

    if (
      !ALLOWED_DOCUMENT_TYPES.includes(documentType)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type.',
      })
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Document title is required.',
      })
    }

    const parsedRequirementId = requirementId
      ? parsePositiveId(requirementId)
      : null

    const parsedComplianceItemId = complianceItemId
      ? parsePositiveId(complianceItemId)
      : null

    if (
      requirementId &&
      !parsedRequirementId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.',
      })
    }

    if (
      complianceItemId &&
      !parsedComplianceItemId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid compliance item ID.',
      })
    }

    if (
      parsedRequirementId &&
      parsedComplianceItemId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'A document can be linked to either a requirement or a compliance item, not both.',
      })
    }

    const requirementValid =
      await validateRequirement(
        parsedRequirementId,
        tenderId
      )

    if (!requirementValid) {
      return res.status(400).json({
        success: false,
        message:
          'The selected requirement does not belong to this tender.',
      })
    }

    const complianceValid =
      await validateComplianceItem(
        parsedComplianceItemId,
        tenderId
      )

    if (!complianceValid) {
      return res.status(400).json({
        success: false,
        message:
          'The selected compliance item does not belong to this tender.',
      })
    }

   

const previousLinkContext =
  await getDocumentLinkContext({
    requirementId: existing.requirement_id || null,
    complianceItemId:
      existing.compliance_item_id || null,
  })

const newLinkContext =
  await getDocumentLinkContext({
    requirementId: parsedRequirementId,
    complianceItemId: parsedComplianceItemId,
  })

    const updatedDocument =
  await updateTenderDocument(
    documentId,
    {
      documentType,
      title: title.trim(),
      description:
        description?.trim() || null,
      requirementId:
        parsedRequirementId,
      complianceItemId:
        parsedComplianceItemId,

      // If a replacement file was uploaded,
      // update the stored file information.
      fileName: req.file?.originalname || null,
      storedFileName: req.file?.filename || null,
      filePath: req.file?.path || null,
      fileUrl: null,
      mimeType: req.file?.mimetype || null,
      fileSize: req.file?.size || null,
    }
  )


  const previousDocumentType =
  existing.document_type

const newDocumentType =
  updatedDocument.document_type

const previousTitle =
  existing.title

const newTitle =
  updatedDocument.title

const previousFileName =
  existing.file_name

const newFileName =
  updatedDocument.file_name

const descriptionChanged =
  (existing.description || '') !==
  (updatedDocument.description || '')

const linkChanged =
  previousLinkContext.linkType !==
    newLinkContext.linkType ||
  Number(previousLinkContext.linkId || 0) !==
    Number(newLinkContext.linkId || 0)

const isEvidence =
  newDocumentType === 'INTERNAL_SUBMISSION'

await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'DOCUMENT_UPDATED',
  entityType: 'DOCUMENT',
  entityId: documentId,
  description:
    `${isEvidence ? 'Evidence' : 'Source document'} ` +
    `"${newTitle}" was updated.`,
  metadata: {
    documentId,

    previousDocumentType,
    newDocumentType,

    previousTitle,
    newTitle,

    descriptionChanged,

    previousFileName,
    newFileName,
    fileReplaced: Boolean(req.file),

    linkChanged,

    previousLinkType:
      previousLinkContext.linkType,
    previousLinkId:
      previousLinkContext.linkId,
    previousLinkTitle:
      previousLinkContext.linkTitle,

    newLinkType:
      newLinkContext.linkType,
    newLinkId:
      newLinkContext.linkId,
    newLinkTitle:
      newLinkContext.linkTitle,
  },
})

    const summary =
      await getTenderDocumentSummary(tenderId)

    return res.json({
      success: true,
    message: req.file
  ? 'Document and file replaced successfully.'
  : 'Document information updated successfully.',
      summary,
      data: updatedDocument,
    })
  } catch (error) {

    removePhysicalFile(req.file?.path)
    
    console.error(
      'Edit tender document error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to update document information.',
    })
  }
}

export const downloadTenderDocument = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveId(
      req.params.tenderId
    )

    const documentId = parsePositiveId(
      req.params.documentId
    )

    if (!tenderId || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or document ID.',
      })
    }

    const tender = await getTenderOrFail(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const document =
      await getTenderDocumentById(documentId)

    if (
      !document ||
      Number(document.tender_id) !== tenderId
    ) {
      return res.status(404).json({
        success: false,
        message: 'Document not found for this tender.',
      })
    }

    const absolutePath = path.resolve(
      document.file_path
    )

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message:
          'The document file is missing from storage.',
      })
    }

    return res.download(
      absolutePath,
      document.file_name
    )
  } catch (error) {
    console.error(
      'Download tender document error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to download document.',
    })
  }
}


export const previewTenderDocument = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveId(
      req.params.tenderId
    )

    const documentId = parsePositiveId(
      req.params.documentId
    )

    if (!tenderId || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or document ID.',
      })
    }

    const tender = await getTenderOrFail(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const document =
      await getTenderDocumentById(documentId)

    if (
      !document ||
      Number(document.tender_id) !== tenderId
    ) {
      return res.status(404).json({
        success: false,
        message:
          'Document not found for this tender.',
      })
    }

    const absolutePath = path.resolve(
      document.file_path
    )

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message:
          'The document file is missing from storage.',
      })
    }

    res.setHeader(
      'Content-Type',
      document.mime_type ||
        'application/octet-stream'
    )

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(
        document.file_name
      )}"`
    )

    return res.sendFile(absolutePath)
  } catch (error) {
    console.error(
      'Preview tender document error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to preview document.',
    })
  }
}

export const removeTenderDocument = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveId(
      req.params.tenderId
    )

    const documentId = parsePositiveId(
      req.params.documentId
    )

    if (!tenderId || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or document ID.',
      })
    }

    const tender = await getTenderOrFail(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const document =
  await getTenderDocumentById(documentId)

if (
  !document ||
  Number(document.tender_id) !== tenderId
) {
  return res.status(404).json({
    success: false,
    message: 'Document not found for this tender.',
  })
}

// Employees may remove Internal Submission documents only.
// No assignment, ownership, or link check is required.
if (
  req.user.role === 'EMPLOYEE' &&
  document.document_type !== 'INTERNAL_SUBMISSION'
) {
  return res.status(403).json({
    success: false,
    message:
      'Employees can only remove internal submission documents.',
  })
}

const linkContext =
  await getDocumentLinkContext({
    requirementId:
      document.requirement_id || null,
    complianceItemId:
      document.compliance_item_id || null,
  })

const removed =
  await deactivateTenderDocument(documentId)

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Document is already removed.',
      })
    }

    /*
      We intentionally do NOT delete the physical file here.

      The database record is soft-deleted first so we preserve
      an audit trail and avoid accidental permanent destruction.

      A future administrator cleanup/archive process can safely
      remove orphaned physical files.
    */


      const isEvidence =
  document.document_type === 'INTERNAL_SUBMISSION'

const documentLabel = isEvidence
  ? 'evidence'
  : 'source document'

let activityDescription =
  `${isEvidence ? 'Evidence' : 'Source document'} ` +
  `"${document.file_name}" was removed.`

if (linkContext.linkType === 'REQUIREMENT') {
  activityDescription +=
    ` Linked to requirement "${linkContext.linkTitle}".`
} else if (linkContext.linkType === 'COMPLIANCE') {
  activityDescription +=
    ` Linked to compliance item "${linkContext.linkTitle}".`
} else {
  activityDescription += ' Linked to tender.'
}

await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'DOCUMENT_ARCHIVED',
  entityType: 'DOCUMENT',
  entityId: documentId,
  description: activityDescription,
  metadata: {
    documentId,
    documentType: document.document_type,
    documentLabel,
    title: document.title,
    fileName: document.file_name,

    linkType: linkContext.linkType,
    linkId: linkContext.linkId,
    linkTitle: linkContext.linkTitle,

    requirementId:
      document.requirement_id || null,
    complianceItemId:
      document.compliance_item_id || null,
  },
})

    const summary =
      await getTenderDocumentSummary(tenderId)

    return res.json({
      success: true,
      message: 'Document removed successfully.',
      summary,
    })
  } catch (error) {
    console.error(
      'Remove tender document error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to remove document.',
    })
  }
}