import pool from '../config/db.js'

/* =========================================================
   GET ALL ACTIVE REQUIREMENTS FOR ONE TENDER
========================================================= */

export const getTenderRequirements = async (tenderId) => {
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
      tr.assigned_user_id,
      assigned_user.name AS assigned_user_name,
      assigned_user.email AS assigned_user_email,
      assigned_user.department AS assigned_user_department,
      tr.due_date,
      tr.sort_order,
      tr.is_active,
      tr.created_by,
      creator.name AS created_by_name,
      tr.completed_by,
      completed_user.name AS completed_by_name,
      tr.completed_at,
      tr.created_at,
      tr.updated_at
    FROM tender_requirements tr

    LEFT JOIN users assigned_user
      ON tr.assigned_user_id = assigned_user.id

    LEFT JOIN users creator
      ON tr.created_by = creator.id

    LEFT JOIN users completed_user
      ON tr.completed_by = completed_user.id

    LEFT JOIN users reviewer
      ON tr.reviewed_by = reviewer.id

    WHERE tr.tender_id = ?
      AND tr.is_active = 1

    ORDER BY
      tr.sort_order ASC,
      tr.created_at ASC,
      tr.id ASC
    `,
    [tenderId]
  )

  return rows
}

/* =========================================================
   GET ONE REQUIREMENT
========================================================= */

export const getTenderRequirementById = async (
  tenderId,
  requirementId
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
      tr.assigned_user_id,
      assigned_user.name AS assigned_user_name,
      assigned_user.email AS assigned_user_email,
      assigned_user.department AS assigned_user_department,
      tr.due_date,
      tr.sort_order,
      tr.is_active,
      tr.created_by,
      creator.name AS created_by_name,
      tr.completed_by,
      completed_user.name AS completed_by_name,
      tr.completed_at,
      tr.created_at,
      tr.updated_at
    FROM tender_requirements tr

    LEFT JOIN users assigned_user
      ON tr.assigned_user_id = assigned_user.id

    LEFT JOIN users creator
      ON tr.created_by = creator.id

    LEFT JOIN users completed_user
      ON tr.completed_by = completed_user.id
    
    LEFT JOIN users reviewer
      ON tr.reviewed_by = reviewer.id

    WHERE tr.id = ?
      AND tr.tender_id = ?
      AND tr.is_active = 1

    LIMIT 1
    `,
    [requirementId, tenderId]
  )

  return rows[0] || null
}

/* =========================================================
   CREATE REQUIREMENT
========================================================= */

export const createTenderRequirement = async ({
  tenderId,
  category,
  title,
  description,
  isMandatory,
  status,
  assignedUserId,
  dueDate,
  sortOrder,
  createdBy,
}) => {
  const [result] = await pool.query(
    `
    INSERT INTO tender_requirements (
      tender_id,
      category,
      title,
      description,
      is_mandatory,
      status,
      assigned_user_id,
      due_date,
      sort_order,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      tenderId,
      category || 'OTHER',
      title,
      description || null,
      isMandatory ? 1 : 0,
      status || 'NOT_STARTED',
      assignedUserId || null,
      dueDate || null,
      sortOrder ?? 0,
      createdBy,
    ]
  )

  return result.insertId
}

/* =========================================================
   UPDATE REQUIREMENT
========================================================= */

export const updateTenderRequirementById = async (
  tenderId,
  requirementId,
  {
    category,
    title,
    description,
    isMandatory,
    status,
    assignedUserId,
    dueDate,
    sortOrder,
    completedBy,
    completedAt,
  }
) => {
  const [result] = await pool.query(
    `
    UPDATE tender_requirements
    SET
      category = ?,
      title = ?,
      description = ?,
      is_mandatory = ?,
      status = ?,
      assigned_user_id = ?,
      due_date = ?,
      sort_order = ?,
      completed_by = ?,
      completed_at = ?
    WHERE id = ?
      AND tender_id = ?
      AND is_active = 1
    `,
    [
      category || 'OTHER',
      title,
      description || null,
      isMandatory ? 1 : 0,
      status,
      assignedUserId || null,
      dueDate || null,
      sortOrder ?? 0,
      completedBy || null,
      completedAt || null,
      requirementId,
      tenderId,
    ]
  )

  return result.affectedRows
}

/* =========================================================
   SOFT DELETE REQUIREMENT
   Keep history instead of physically deleting the row
========================================================= */

export const deactivateTenderRequirement = async (
  tenderId,
  requirementId
) => {
  const [result] = await pool.query(
    `
    UPDATE tender_requirements
    SET is_active = 0
    WHERE id = ?
      AND tender_id = ?
      AND is_active = 1
    `,
    [requirementId, tenderId]
  )

  return result.affectedRows
}

/* =========================================================
   CHECK WHETHER EMPLOYEE IS ASSIGNED TO THIS TENDER
========================================================= */

export const isUserAssignedToTender = async (
  tenderId,
  userId
) => {
  const [rows] = await pool.query(
    `
    SELECT id
    FROM assignments
    WHERE tender_id = ?
      AND user_id = ?
    LIMIT 1
    `,
    [tenderId, userId]
  )

  return rows.length > 0
}

/* =========================================================
   REQUIREMENT SUMMARY
========================================================= */

export const getTenderRequirementSummary = async (
  tenderId
) => {
  const [rows] = await pool.query(
    `
    SELECT
      COUNT(*) AS total,

      SUM(
        CASE
          WHEN status = 'NOT_STARTED' THEN 1
          ELSE 0
        END
      ) AS not_started,

      SUM(
        CASE
          WHEN status = 'IN_PROGRESS' THEN 1
          ELSE 0
        END
      ) AS in_progress,

      SUM(
        CASE
          WHEN status = 'COMPLETED' THEN 1
          ELSE 0
        END
      ) AS completed,

      SUM(
        CASE
          WHEN status = 'NOT_APPLICABLE' THEN 1
          ELSE 0
        END
      ) AS not_applicable,

      SUM(
        CASE
          WHEN is_mandatory = 1 THEN 1
          ELSE 0
        END
      ) AS mandatory,

      SUM(
        CASE
          WHEN
            due_date IS NOT NULL
            AND due_date < CURDATE()
            AND status NOT IN (
              'COMPLETED',
              'NOT_APPLICABLE'
            )
          THEN 1
          ELSE 0
        END
      ) AS overdue

    FROM tender_requirements

    WHERE tender_id = ?
      AND is_active = 1
    `,
    [tenderId]
  )

  const summary = rows[0]

  return {
    total: Number(summary.total || 0),
    notStarted: Number(summary.not_started || 0),
    inProgress: Number(summary.in_progress || 0),
    completed: Number(summary.completed || 0),
    notApplicable: Number(
      summary.not_applicable || 0
    ),
    mandatory: Number(summary.mandatory || 0),
    overdue: Number(summary.overdue || 0),
  }
}



export const updateTenderRequirementReview = async (
  tenderId,
  requirementId,
  {
    reviewStatus,
    reviewedBy = null,
    reviewedAt = null,
    reviewComment = null,
  }
) => {
  const [result] = await pool.query(
    `
    UPDATE tender_requirements
    SET
      review_status = ?,
      reviewed_by = ?,
      reviewed_at = ?,
      review_comment = ?
    WHERE id = ?
      AND tender_id = ?
      AND is_active = 1
    `,
    [
      reviewStatus,
      reviewedBy,
      reviewedAt,
      reviewComment,
      requirementId,
      tenderId,
    ]
  )

  return result.affectedRows
}