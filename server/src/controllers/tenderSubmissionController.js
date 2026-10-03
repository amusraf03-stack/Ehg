import {
  getTenderById,
  submitTenderById,
} from '../models/tenderModel.js'

import {
  getTenderReadiness,
} from '../models/tenderReviewModel.js'
import {
  getTenderDocuments,
} from '../models/tenderDocumentModel.js'

const parsePositiveInteger = (value) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}


const normalizeNullableText = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  const trimmed = String(value).trim()

  return trimmed === '' ? null : trimmed
}


/* =========================================================
   GET FINAL SUBMISSION DETAILS

   GET /api/tenders/:tenderId/submission
========================================================= */

export const getTenderSubmission = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = parsePositiveInteger(
      req.params.tenderId
    )

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const readiness =
      await getTenderReadiness(tenderId)


    const documents =
  await getTenderDocuments(tenderId)

const finalSubmissionDocuments =
  documents.filter(
    (document) =>
      document.document_type ===
        'INTERNAL_SUBMISSION' &&
      !document.requirement_id &&
      !document.compliance_item_id
  ) 

   return res.status(200).json({
  success: true,

  tender: {
    id: tender.id,
    reference_no: tender.reference_no,
    title: tender.title,
    status: tender.status,

    submission_method:
      tender.submission_method,

    submission_location:
      tender.submission_location,

    submission_reference:
      tender.submission_reference,

    submission_notes:
      tender.submission_notes,

    submitted_by:
      tender.submitted_by,

    submitted_by_name:
      tender.submitted_by_name,

    submitted_by_email:
      tender.submitted_by_email,

    submitted_at:
      tender.submitted_at,
  },

  readiness,

  finalSubmissionDocuments,
})
  } catch (error) {
    next(error)
  }
}


/* =========================================================
   MARK TENDER AS SUBMITTED

   PATCH /api/tenders/:tenderId/submission
========================================================= */

export const submitTender = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = parsePositiveInteger(
      req.params.tenderId
    )

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    // --------------------------------------------------
    // Tender must exist
    // --------------------------------------------------

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    // --------------------------------------------------
    // Do not submit the same tender twice
    // --------------------------------------------------

    if (tender.status === 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message:
          'This tender has already been submitted.',
      })
    }

    // --------------------------------------------------
    // Check Requirement + Compliance approvals
    // --------------------------------------------------

    const readiness =
      await getTenderReadiness(tenderId)

    if (!readiness?.ready) {
      return res.status(400).json({
        success: false,
        message:
          'Tender is not ready for final submission. All required requirements and compliance items must be approved.',
        readiness,
      })
    }

    // --------------------------------------------------
    // Submission information
    // --------------------------------------------------

    const {
      submissionMethod,
      submissionLocation,
      submissionReference,
      submissionNotes,
    } = req.body || {}

    const normalizedMethod =
      normalizeNullableText(submissionMethod)

    const normalizedLocation =
      normalizeNullableText(submissionLocation)

    const normalizedReference =
      normalizeNullableText(submissionReference)

    const normalizedNotes =
      normalizeNullableText(submissionNotes)

    // --------------------------------------------------
    // Save final submission
    // --------------------------------------------------

    const affectedRows =
      await submitTenderById({
        tenderId,

        submittedBy: req.user.id,

        submissionMethod:
          normalizedMethod,

        submissionLocation:
          normalizedLocation,

        submissionReference:
          normalizedReference,

        submissionNotes:
          normalizedNotes,
      })

    if (!affectedRows) {
      return res.status(400).json({
        success: false,
        message:
          'Tender could not be marked as submitted.',
      })
    }

    // --------------------------------------------------
    // Return updated tender
    // --------------------------------------------------

    const updatedTender =
      await getTenderById(tenderId)

    return res.status(200).json({
      success: true,
      message:
        'Tender marked as submitted successfully.',
      data: updatedTender,
      readiness,
    })
  } catch (error) {
    next(error)
  }
}