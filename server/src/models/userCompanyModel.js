import pool from '../config/db.js'

// ======================================================
// USER ↔ COMPANY MEMBERSHIP
// ======================================================

export const getUserCompanies = async (userId) => {
  const [rows] = await pool.query(
    `
      SELECT
        uc.id,
        uc.user_id,
        uc.company_id,
        c.name AS company_name,
        c.code AS company_code,
        uc.is_primary,
        uc.active_from,
        uc.active_to,
        uc.status,
        uc.created_at,
        uc.updated_at
      FROM user_companies uc
      INNER JOIN companies c
        ON uc.company_id = c.id
      WHERE uc.user_id = ?
      ORDER BY
        uc.status = 'ACTIVE' DESC,
        uc.is_primary DESC,
        c.name ASC
    `,
    [userId]
  )

  return rows
}

export const findActiveUserCompany = async (
  userId,
  companyId
) => {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM user_companies
      WHERE user_id = ?
        AND company_id = ?
        AND status = 'ACTIVE'
      LIMIT 1
    `,
    [userId, companyId]
  )

  return rows[0] || null
}


export const findUserCompany = async (
  userId,
  companyId
) => {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM user_companies
      WHERE user_id = ?
        AND company_id = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [userId, companyId]
  )

  return rows[0] || null
}

export const addUserToCompany = async ({
  userId,
  companyId,
  isPrimary = false,
  activeFrom = null,
}) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // If this is the primary company,
    // remove primary flag from other active memberships.
    if (isPrimary) {
      await connection.query(
        `
          UPDATE user_companies
          SET is_primary = FALSE
          WHERE user_id = ?
            AND status = 'ACTIVE'
        `,
        [userId]
      )
    }

    const [result] = await connection.query(
      `
        INSERT INTO user_companies (
          user_id,
          company_id,
          is_primary,
          active_from,
          status
        )
        VALUES (?, ?, ?, ?, 'ACTIVE')
      `,
      [
        userId,
        companyId,
        Boolean(isPrimary),
        activeFrom,
      ]
    )

    await connection.commit()

    return result.insertId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateUserCompany = async ({
  userId,
  companyId,
  isPrimary,
  activeFrom,
}) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    if (isPrimary === true) {
      await connection.query(
        `
          UPDATE user_companies
          SET is_primary = FALSE
          WHERE user_id = ?
            AND status = 'ACTIVE'
        `,
        [userId]
      )
    }

    const fields = []
    const values = []

    if (typeof isPrimary === 'boolean') {
      fields.push('is_primary = ?')
      values.push(isPrimary)
    }

    if (activeFrom !== undefined) {
      fields.push('active_from = ?')
      values.push(activeFrom || null)
    }

    if (fields.length === 0) {
      await connection.rollback()
      return 0
    }

    values.push(userId, companyId)

    const [result] = await connection.query(
      `
        UPDATE user_companies
        SET ${fields.join(', ')}
        WHERE user_id = ?
          AND company_id = ?
          AND status = 'ACTIVE'
      `,
      values
    )

    await connection.commit()

    return result.affectedRows
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const deactivateUserCompany = async ({
  userId,
  companyId,
  activeTo,
}) => {
  const [result] = await pool.query(
    `
      UPDATE user_companies
      SET
        status = 'INACTIVE',
        is_primary = FALSE,
        active_to = COALESCE(?, CURDATE())
      WHERE user_id = ?
        AND company_id = ?
        AND status = 'ACTIVE'
    `,
    [
      activeTo || null,
      userId,
      companyId,
    ]
  )

  return result.affectedRows
}

export const activateUserCompany = async ({
  userId,
  companyId,
}) => {
  const [result] = await pool.query(
    `
      UPDATE user_companies
      SET
        status = 'ACTIVE',
        is_primary = FALSE,
        active_from = CURDATE(),
        active_to = NULL
      WHERE user_id = ?
        AND company_id = ?
        AND status = 'INACTIVE'
    `,
    [userId, companyId]
  )

  return result.affectedRows
}


// ======================================================
// COMPANY PERMISSIONS / DELEGATION
// ======================================================

export const getUserCompanyPermissions = async (
  userId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        ucp.id,
        ucp.user_id,
        ucp.company_id,
        c.name AS company_name,
        c.code AS company_code,
        ucp.can_view,
        ucp.can_manage,
        ucp.can_view_metrics,
        ucp.granted_by,
        grantor.name AS granted_by_name,
        ucp.granted_at,
        ucp.revoked_at
      FROM user_company_permissions ucp
      INNER JOIN companies c
        ON ucp.company_id = c.id
      LEFT JOIN users grantor
        ON ucp.granted_by = grantor.id
      WHERE ucp.user_id = ?
      ORDER BY c.name ASC
    `,
    [userId]
  )

  return rows
}

export const findUserCompanyPermission = async (
  userId,
  companyId
) => {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM user_company_permissions
      WHERE user_id = ?
        AND company_id = ?
      LIMIT 1
    `,
    [userId, companyId]
  )

  return rows[0] || null
}

export const grantCompanyPermission = async ({
  userId,
  companyId,
  canView = true,
  canManage = false,
  canViewMetrics = false,
  grantedBy,
}) => {
  await pool.query(
    `
      INSERT INTO user_company_permissions (
        user_id,
        company_id,
        can_view,
        can_manage,
        can_view_metrics,
        granted_by,
        granted_at,
        revoked_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL)

      ON DUPLICATE KEY UPDATE
        can_view = VALUES(can_view),
        can_manage = VALUES(can_manage),
        can_view_metrics = VALUES(can_view_metrics),
        granted_by = VALUES(granted_by),
        granted_at = CURRENT_TIMESTAMP,
        revoked_at = NULL
    `,
    [
      userId,
      companyId,
      Boolean(canView),
      Boolean(canManage),
      Boolean(canViewMetrics),
      grantedBy,
    ]
  )
}

export const revokeCompanyPermission = async ({
  userId,
  companyId,
}) => {
  const [result] = await pool.query(
    `
      UPDATE user_company_permissions
      SET
        can_view = FALSE,
        can_manage = FALSE,
        can_view_metrics = FALSE,
        revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND company_id = ?
        AND revoked_at IS NULL
    `,
    [userId, companyId]
  )

  return result.affectedRows
}