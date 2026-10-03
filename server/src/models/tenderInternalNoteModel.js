import pool from '../config/db.js'

export const getTenderInternalNotes = async (
  tenderId
) => {
  const [rows] = await pool.execute(
    `
      SELECT
        n.id,
        n.tender_id,
        n.note_type,
        n.content,
        n.created_by,
        u.name AS created_by_name,
        u.email AS created_by_email,
        n.created_at,
        n.updated_at
      FROM tender_internal_notes n
      INNER JOIN users u
        ON u.id = n.created_by
      WHERE n.tender_id = ?
        AND n.is_active = 1
     ORDER BY n.created_at ASC, n.id ASC
    `,
    [tenderId]
  )

  return rows
}



export const createTenderInternalNote = async ({
  tenderId,
  noteType,
  
  content,
  createdBy,
}) => {
  const [result] = await pool.execute(
    `
      INSERT INTO tender_internal_notes (
        tender_id,
        note_type,
        content,
        created_by
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      tenderId,
      noteType,
      content,
      createdBy,
    ]
  )

  const [rows] = await pool.execute(
    `
      SELECT
        n.id,
        n.tender_id,
        n.note_type,
       
        n.content,
        n.created_by,
        u.name AS created_by_name,
        u.email AS created_by_email,
        n.created_at,
        n.updated_at
      FROM tender_internal_notes n
      INNER JOIN users u
        ON u.id = n.created_by
      WHERE n.id = ?
        AND n.is_active = 1
      LIMIT 1
    `,
    [result.insertId]
  )

  return rows[0] || null
}




export const getTenderInternalNoteById = async (
  noteId
) => {
  const [rows] = await pool.execute(
    `
      SELECT
        n.id,
        n.tender_id,
        n.note_type,
        n.content,
        n.created_by,
        u.name AS created_by_name,
        u.email AS created_by_email,
        n.created_at,
        n.updated_at
      FROM tender_internal_notes n
      INNER JOIN users u
        ON u.id = n.created_by
      WHERE n.id = ?
        AND n.is_active = 1
      LIMIT 1
    `,
    [noteId]
  )

  return rows[0] || null
}

export const updateTenderInternalNote = async ({
  noteId,
  noteType,
  content,
}) => {
  const [result] = await pool.execute(
    `
      UPDATE tender_internal_notes
      SET
        note_type = ?,
        content = ?
      WHERE id = ?
        AND is_active = 1
    `,
    [
      noteType,
      content,
      noteId,
    ]
  )

  if (!result.affectedRows) {
    return null
  }

  return getTenderInternalNoteById(noteId)
}


export const archiveTenderInternalNote = async (
  noteId
) => {
  const [result] = await pool.execute(
    `
      UPDATE tender_internal_notes
      SET is_active = 0
      WHERE id = ?
        AND is_active = 1
    `,
    [noteId]
  )

  return result.affectedRows
}