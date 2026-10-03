import pool from '../config/db.js'

export const createTenderActivity = async ({
  tenderId,
  userId = null,
  actionType,
  entityType = null,
  entityId = null,
  description,
  metadata = null,
}) => {
  const serializedMetadata =
    metadata === null
      ? null
      : JSON.stringify(metadata)

  const [result] = await pool.query(
    `
    INSERT INTO tender_activity_logs (
      tender_id,
      user_id,
      action_type,
      entity_type,
      entity_id,
      description,
      metadata
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      tenderId,
      userId,
      actionType,
      entityType,
      entityId,
      description,
      serializedMetadata,
    ]
  )

  return result.insertId
}

export const getTenderActivities = async (
  tenderId
) => {
  const [rows] = await pool.query(
    `
    SELECT
      activity.id,
      activity.tender_id,
      activity.user_id,
      activity.action_type,
      activity.entity_type,
      activity.entity_id,
      activity.description,
      activity.metadata,
      activity.created_at,

      users.name AS user_name,
      users.email AS user_email

    FROM tender_activity_logs activity

    LEFT JOIN users
      ON activity.user_id = users.id

    WHERE activity.tender_id = ?

    ORDER BY
      activity.created_at DESC,
      activity.id DESC
    `,
    [tenderId]
  )

  return rows.map((activity) => {
  let metadata = activity.metadata

  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata)
    } catch {
      metadata = null
    }
  }

  return {
    ...activity,
    metadata,
  }
})
}