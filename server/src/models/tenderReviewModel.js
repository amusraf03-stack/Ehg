import pool from '../config/db.js'

/* =========================================================
   HELPER
   Convert joined SQL rows into one item with many evidence
========================================================= */

const groupReviewRows = (rows) => {
  const itemMap = new Map()

  for (const row of rows) {
    if (!itemMap.has(row.id)) {
      itemMap.set(row.id, {
        id: row.id,
        tender_id: row.tender_id,
        category: row.category,
        title: row.title,
        description: row.description,
        is_mandatory: row.is_mandatory,

        // Work status
        status: row.status,

        // Review status
        review_status: row.review_status,

        reviewed_by: row.reviewed_by,
        reviewed_by_name: row.reviewed_by_name,
        reviewed_at: row.reviewed_at,
        review_comment: row.review_comment,

        completed_by: row.completed_by,
        completed_by_name: row.completed_by_name,
        completed_at: row.completed_at,

        created_at: row.created_at,
        updated_at: row.updated_at,

        evidence: [],
      })
    }

    // One requirement/compliance item may contain
    // multiple evidence documents.
    if (row.document_id) {
      itemMap.get(row.id).evidence.push({
        id: row.document_id,
        title: row.document_title,
        description: row.document_description,

        file_name: row.file_name,
        stored_file_name: row.stored_file_name,
        file_path: row.file_path,
        file_url: row.file_url,
        mime_type: row.mime_type,
        file_size: row.file_size,

        uploaded_by: row.uploaded_by,
        uploaded_by_name: row.uploaded_by_name,
        uploaded_by_email: row.uploaded_by_email,

        created_at: row.document_created_at,
        updated_at: row.document_updated_at,
      })
    }
  }

  return Array.from(itemMap.values())
}

/* =========================================================
   GET REQUIREMENTS FOR REVIEW

   Evidence belongs to the Requirement.

   IMPORTANT:
   Unlinked documents are NOT included here.
========================================================= */

export const getTenderReviewRequirements = async (
  tenderId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        tr.id,
        tr.tender_id,
        tr.category,
        tr.title,
        tr.description,
        tr.is_mandatory,

        tr.status,

        tr.review_status,
        tr.reviewed_by,
        reviewer.name AS reviewed_by_name,
        tr.reviewed_at,
        tr.review_comment,

        tr.completed_by,
        completer.name AS completed_by_name,
        tr.completed_at,

        tr.created_at,
        tr.updated_at,

        td.id AS document_id,
        td.title AS document_title,
        td.description AS document_description,

        td.file_name,
        td.stored_file_name,
        td.file_path,
        td.file_url,
        td.mime_type,
        td.file_size,

        td.uploaded_by,
        uploader.name AS uploaded_by_name,
        uploader.email AS uploaded_by_email,

        td.created_at AS document_created_at,
        td.updated_at AS document_updated_at

      FROM tender_requirements tr

      LEFT JOIN users completer
        ON completer.id = tr.completed_by

      LEFT JOIN users reviewer
        ON reviewer.id = tr.reviewed_by

      LEFT JOIN tender_documents td
        ON td.requirement_id = tr.id
        AND td.tender_id = tr.tender_id
        AND td.document_type = 'INTERNAL_SUBMISSION'
        AND td.is_active = 1

      LEFT JOIN users uploader
        ON uploader.id = td.uploaded_by

      WHERE tr.tender_id = ?
        AND tr.is_active = 1

      ORDER BY
        tr.sort_order ASC,
        tr.id ASC,
        td.created_at DESC,
        td.id DESC
    `,
    [tenderId]
  )

  return groupReviewRows(rows)
}

/* =========================================================
   GET COMPLIANCE ITEMS FOR REVIEW

   Evidence belongs to the Compliance item.

   IMPORTANT:
   Unlinked documents are NOT included here.
========================================================= */

export const getTenderReviewCompliance = async (
  tenderId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        tci.id,
        tci.tender_id,
        tci.category,
        tci.title,
        tci.description,
        tci.is_mandatory,

        tci.status,

        tci.review_status,
        tci.reviewed_by,
        reviewer.name AS reviewed_by_name,
        tci.reviewed_at,
        tci.review_comment,

        tci.completed_by,
        completer.name AS completed_by_name,
        tci.completed_at,

        tci.created_at,
        tci.updated_at,

        td.id AS document_id,
        td.title AS document_title,
        td.description AS document_description,

        td.file_name,
        td.stored_file_name,
        td.file_path,
        td.file_url,
        td.mime_type,
        td.file_size,

        td.uploaded_by,
        uploader.name AS uploaded_by_name,
        uploader.email AS uploaded_by_email,

        td.created_at AS document_created_at,
        td.updated_at AS document_updated_at

      FROM tender_compliance_items tci

      LEFT JOIN users completer
        ON completer.id = tci.completed_by

      LEFT JOIN users reviewer
        ON reviewer.id = tci.reviewed_by

      LEFT JOIN tender_documents td
        ON td.compliance_item_id = tci.id
        AND td.tender_id = tci.tender_id
        AND td.document_type = 'INTERNAL_SUBMISSION'
        AND td.is_active = 1

      LEFT JOIN users uploader
        ON uploader.id = td.uploaded_by

      WHERE tci.tender_id = ?
        AND tci.is_active = 1

      ORDER BY
        tci.sort_order ASC,
        tci.id ASC,
        td.created_at DESC,
        td.id DESC
    `,
    [tenderId]
  )

  return groupReviewRows(rows)
}

/* =========================================================
   GET TENDER READINESS

   Review readiness is based on Requirement + Compliance
   approval.

   Evidence itself does NOT have a separate approval status.
========================================================= */

export const getTenderReadiness = async (
  tenderId
) => {
  const [requirementRows] = await pool.query(
    `
      SELECT
        COUNT(*) AS total,

        SUM(
          CASE
            WHEN review_status = 'APPROVED'
            THEN 1
            ELSE 0
          END
        ) AS approved,

        SUM(
          CASE
            WHEN review_status = 'AWAITING_REVIEW'
            THEN 1
            ELSE 0
          END
        ) AS awaiting_review,

        SUM(
          CASE
            WHEN review_status = 'CHANGES_REQUESTED'
            THEN 1
            ELSE 0
          END
        ) AS changes_requested,

        SUM(
          CASE
            WHEN status NOT IN (
              'COMPLETED',
              'NOT_APPLICABLE'
            )
            THEN 1
            ELSE 0
          END
        ) AS not_completed,

        SUM(
          CASE
            WHEN status = 'NOT_APPLICABLE'
            THEN 1
            ELSE 0
          END
        ) AS not_applicable

      FROM tender_requirements

      WHERE tender_id = ?
        AND is_active = 1
    `,
    [tenderId]
  )

  const [complianceRows] = await pool.query(
    `
      SELECT
        COUNT(*) AS total,

        SUM(
          CASE
            WHEN review_status = 'APPROVED'
            THEN 1
            ELSE 0
          END
        ) AS approved,

        SUM(
          CASE
            WHEN review_status = 'AWAITING_REVIEW'
            THEN 1
            ELSE 0
          END
        ) AS awaiting_review,

        SUM(
          CASE
            WHEN review_status = 'CHANGES_REQUESTED'
            THEN 1
            ELSE 0
          END
        ) AS changes_requested,

        SUM(
          CASE
            WHEN status NOT IN (
              'COMPLETED',
              'NOT_APPLICABLE'
            )
            THEN 1
            ELSE 0
          END
        ) AS not_completed,

        SUM(
          CASE
            WHEN status = 'NOT_APPLICABLE'
            THEN 1
            ELSE 0
          END
        ) AS not_applicable

      FROM tender_compliance_items

      WHERE tender_id = ?
        AND is_active = 1
    `,
    [tenderId]
  )

  const requirementData =
    requirementRows[0] || {}

  const complianceData =
    complianceRows[0] || {}

  const requirements = {
    total: Number(requirementData.total || 0),

    approved: Number(
      requirementData.approved || 0
    ),

    awaitingReview: Number(
      requirementData.awaiting_review || 0
    ),

    changesRequested: Number(
      requirementData.changes_requested || 0
    ),

    notCompleted: Number(
      requirementData.not_completed || 0
    ),

    notApplicable: Number(
      requirementData.not_applicable || 0
    ),
  }

  const compliance = {
    total: Number(complianceData.total || 0),

    approved: Number(
      complianceData.approved || 0
    ),

    awaitingReview: Number(
      complianceData.awaiting_review || 0
    ),

    changesRequested: Number(
      complianceData.changes_requested || 0
    ),

    notCompleted: Number(
      complianceData.not_completed || 0
    ),

    notApplicable: Number(
      complianceData.not_applicable || 0
    ),
  }

  const pendingReviews =
    requirements.awaitingReview +
    compliance.awaitingReview

  const changesRequested =
    requirements.changesRequested +
    compliance.changesRequested

  const notCompleted =
    requirements.notCompleted +
    compliance.notCompleted

  /*
    NOT_APPLICABLE items are excluded from the number
    that must receive approval.

    Example:
      10 total
      2 NOT_APPLICABLE

    Then only 8 items need approval.
  */

  const requiredRequirementApprovals =
    requirements.total -
    requirements.notApplicable

  const requiredComplianceApprovals =
    compliance.total -
    compliance.notApplicable

  const ready =
    requirements.approved ===
      requiredRequirementApprovals &&
    compliance.approved ===
      requiredComplianceApprovals &&
    pendingReviews === 0 &&
    changesRequested === 0 &&
    notCompleted === 0

  return {
    ready,

    requirements: {
      ...requirements,
      requiredApprovals:
        requiredRequirementApprovals,
    },

    compliance: {
      ...compliance,
      requiredApprovals:
        requiredComplianceApprovals,
    },

    pendingReviews,
    changesRequested,
    notCompleted,
  }
}