import pool from '../config/db.js'
export const getAllTenders = async () => {
  // 1. Get all tenders
  const [tenders] = await pool.query(`
  SELECT
    t.id,
    t.company_id,
    c.name AS company_name,
    c.code AS company_code,

    t.reference_no,
    t.title,
    t.client_name,
    t.description,
    t.category,

    t.status,
    t.priority,
    t.tender_value,
    t.result,
    t.progress,

    t.start_date,
    t.deadline,
    t.closing_time,
    t.internal_deadline,

t.submission_method,
t.submission_location,
t.submitted_at,
t.submitted_by,
t.submission_reference,
t.submission_notes,

submitter.name AS submitted_by_name,
submitter.email AS submitted_by_email,

    t.internal_owner_id,
    owner.name AS internal_owner_name,
    owner.email AS internal_owner_email,
    owner.role_id AS internal_owner_role_id,

    t.created_by,
    creator.name AS created_by_name,

    t.created_at,
    t.updated_at

  FROM tenders t

  LEFT JOIN companies c
    ON t.company_id = c.id

  LEFT JOIN users owner
    ON t.internal_owner_id = owner.id

  LEFT JOIN users creator
    ON t.created_by = creator.id

  LEFT JOIN users submitter
   ON t.submitted_by = submitter.id

  WHERE t.is_active = 1

  ORDER BY t.created_at DESC
`)

  if (tenders.length === 0) {
    return []
  }

  // 2. Get employee assignments for all tenders
  const tenderIds = tenders.map((tender) => tender.id)

  const placeholders = tenderIds
    .map(() => '?')
    .join(',')

  const [assignments] = await pool.query(
    `
    SELECT
      a.id,
      a.tender_id,
      a.user_id,
      a.assigned_by,
      a.assigned_at,
      employee.name AS employee_name,
      employee.email AS employee_email,
      employee.department AS employee_department,
      employee.status AS employee_status,
      assigner.name AS assigned_by_name
    FROM assignments a
    INNER JOIN users employee
      ON a.user_id = employee.id
    INNER JOIN users assigner
      ON a.assigned_by = assigner.id
    WHERE a.tender_id IN (${placeholders})
    ORDER BY a.assigned_at ASC
    `,
    tenderIds
  )

  // 3. Attach assigned employees to each tender
  return tenders.map((tender) => ({
    ...tender,

    assignments: assignments
      .filter(
        (assignment) =>
          assignment.tender_id === tender.id
      )
      .map((assignment) => ({
        id: assignment.id,
        user_id: assignment.user_id,
        employee_name:
          assignment.employee_name,
        employee_email:
          assignment.employee_email,
        department:
          assignment.employee_department,
        status:
          assignment.employee_status,
        assigned_by:
          assignment.assigned_by,
        assigned_by_name:
          assignment.assigned_by_name,
        assigned_at:
          assignment.assigned_at,
      })),
  }))
}
export const getTenderById = async (id) => {
 const [rows] = await pool.query(
  `
  SELECT
    t.id,
    t.company_id,
    c.name AS company_name,
    c.code AS company_code,

    t.reference_no,
    t.title,
    t.client_name,
    t.description,
    t.category,

    t.status,
    t.priority,
    t.tender_value,
    t.result,
    t.progress,

    t.start_date,
    t.deadline,
    t.closing_time,
    t.internal_deadline,

  t.submission_method,
t.submission_location,
t.submitted_at,
t.submitted_by,
t.submission_reference,
t.submission_notes,

submitter.name AS submitted_by_name,
submitter.email AS submitted_by_email,

    t.internal_owner_id,
    owner.name AS internal_owner_name,
    owner.email AS internal_owner_email,

    t.created_by,
    creator.name AS created_by_name,

    t.created_at,
    t.updated_at

  FROM tenders t

  LEFT JOIN companies c
    ON t.company_id = c.id

  LEFT JOIN users owner
    ON t.internal_owner_id = owner.id

  LEFT JOIN users creator
    ON t.created_by = creator.id
  
  LEFT JOIN users submitter
    ON t.submitted_by = submitter.id

  WHERE t.id = ?
    AND t.is_active = 1
  LIMIT 1
  `,
  [id]
)

  return rows[0] || null
}

export const createTender = async ({
  companyId,
  referenceNo,
  title,
  clientName,
  description,
  category,
  status,
  priority,
  tenderValue,
  result,
  progress,
  startDate,
  deadline,
  closingTime,
  internalDeadline,
  submissionMethod,
  submissionLocation,
  internalOwnerId,
  submittedAt,
  createdBy,
}) => {
  const [resultRow] = await pool.query(
    `
    INSERT INTO tenders (
      company_id,
      reference_no,
      title,
      client_name,
      description,
      category,
      status,
      priority,
      tender_value,
      result,
      progress,
      start_date,
      deadline,
      closing_time,
      internal_deadline,
      submission_method,
      submission_location,
      internal_owner_id,
      submitted_at,
      created_by
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    `,
    [
      companyId || null,
      referenceNo,
      title,
      clientName || null,
      description || null,
      category || null,
      status || 'DRAFT',
      priority || 'MEDIUM',
      tenderValue ?? null,
      result || 'PENDING',
      progress ?? 0,
      startDate || null,
      deadline || null,
      closingTime || null,
      internalDeadline || null,
      submissionMethod || null,
      submissionLocation || null,
      internalOwnerId || null,
      submittedAt || null,
      createdBy,
    ]
  )

  return resultRow.insertId
}

export const updateTenderById = async (
  id,
  {
    companyId,
    referenceNo,
    title,
    clientName,
    description,
    category,
    status,
    priority,
    tenderValue,
    result,
    progress,
    startDate,
    deadline,
    closingTime,
    internalDeadline,
    submissionMethod,
    submissionLocation,
    internalOwnerId,
    submittedAt,
  }
) => {
  const [updateResult] = await pool.query(
    `
    UPDATE tenders
    SET
      company_id = ?,
      reference_no = ?,
      title = ?,
      client_name = ?,
      description = ?,
      category = ?,
      status = ?,
      priority = ?,
      tender_value = ?,
      result = ?,
      progress = ?,
      start_date = ?,
      deadline = ?,
      closing_time = ?,
      internal_deadline = ?,
      submission_method = ?,
      submission_location = ?,
      internal_owner_id = ?,
      submitted_at = ?
    WHERE id = ?
    `,
    [
      companyId || null,
      referenceNo,
      title,
      clientName || null,
      description || null,
      category || null,
      status,
      priority,
      tenderValue ?? null,
      result || 'PENDING',
      progress,
      startDate || null,
      deadline || null,
      closingTime || null,
      internalDeadline || null,
      submissionMethod || null,
      submissionLocation || null,
      internalOwnerId || null,
      submittedAt || null,
      id,
    ]
  )

  return updateResult.affectedRows
}

export const assignTenderToEmployee = async ({
  tenderId,
  userId,
  assignedBy,
}) => {
  const [result] = await pool.query(
    `
    INSERT INTO assignments (
      tender_id,
      user_id,
      assigned_by
    )
    VALUES (?, ?, ?)
    `,
    [tenderId, userId, assignedBy]
  )

  return result.insertId
}



export const getTenderEmployeeById = async (userId) => {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      email
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  )

  return rows[0] || null
}

export const getTenderAssignments = async (tenderId) => {
  const [rows] = await pool.query(
    `
    SELECT
      a.id,
      a.tender_id,
      a.user_id,
      a.assigned_by,
      a.assigned_at,
      employee.name AS employee_name,
      employee.email AS employee_email,
      assigner.name AS assigned_by_name
    FROM assignments a
    INNER JOIN users employee
      ON a.user_id = employee.id
    INNER JOIN users assigner
      ON a.assigned_by = assigner.id
    WHERE a.tender_id = ?
    ORDER BY a.assigned_at DESC
    `,
    [tenderId]
  )

  return rows
}

export const getAssignedTendersByUserId = async (userId) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id,
      t.reference_no AS referenceNo,
      t.title,
      t.client_name AS clientName,
      t.description,
      t.status,
      t.priority,
      t.progress,
      t.start_date AS startDate,
      t.deadline,
      a.assigned_at AS assignedAt,
      assigner.name AS assignedByName
    FROM assignments a

    INNER JOIN tenders t
      ON a.tender_id = t.id

    INNER JOIN users assigner
      ON a.assigned_by = assigner.id

    WHERE a.user_id = ?
      AND t.is_active = 1

    ORDER BY
      CASE
        WHEN t.deadline IS NULL THEN 1
        ELSE 0
      END,
      t.deadline ASC,
      a.assigned_at DESC
    `,
    [userId]
  )

  return rows
}


export const removeTenderAssignment = async ({
  tenderId,
  userId,
}) => {
  const [result] = await pool.query(
    `
    DELETE FROM assignments
    WHERE tender_id = ?
      AND user_id = ?
    `,
    [tenderId, userId]
  )

  return result.affectedRows
}



export const isUserAssignedToTender = async ({
  tenderId,
  userId,
}) => {
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



export const archiveTenderById = async (tenderId) => {
  const [result] = await pool.query(
    `
    UPDATE tenders
    SET is_active = 0
    WHERE id = ?
      AND is_active = 1
    `,
    [tenderId]
  )

  return result.affectedRows
}



export const submitTenderById = async ({
  tenderId,
  submittedBy,
  submissionMethod,
  submissionLocation,
  submissionReference,
  submissionNotes,
}) => {
  const [result] = await pool.query(
    `
    UPDATE tenders
    SET
      status = 'SUBMITTED',
      submission_method = ?,
      submission_location = ?,
      submission_reference = ?,
      submission_notes = ?,
      submitted_by = ?,
      submitted_at = NOW()
    WHERE id = ?
      AND is_active = 1
      AND status <> 'SUBMITTED'
    `,
    [
      submissionMethod || null,
      submissionLocation || null,
      submissionReference || null,
      submissionNotes || null,
      submittedBy,
      tenderId,
    ]
  )

  return result.affectedRows
}