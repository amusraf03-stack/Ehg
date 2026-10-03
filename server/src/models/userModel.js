import pool from '../config/db.js'

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.phone,
        users.password_hash,
        users.department,
        users.status,
        users.last_login_at,
        users.created_at,
        users.updated_at,
        roles.id AS role_id,
        roles.name AS role
      FROM users
      INNER JOIN roles
        ON users.role_id = roles.id
      WHERE users.email = ?
      LIMIT 1
    `,
    [email]
  )

  return rows[0] || null
}

export const findUserById = async (id) => {
  const [rows] = await pool.query(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.phone,
        users.department,
        users.status,
        users.last_login_at,
        users.created_at,
        users.updated_at,
        roles.id AS role_id,
        roles.name AS role
      FROM users
      INNER JOIN roles
        ON users.role_id = roles.id
      WHERE users.id = ?
      LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

export const findRoleByName = async (roleName) => {
  const [rows] = await pool.query(
    `
      SELECT id, name
      FROM roles
      WHERE name = ?
      LIMIT 1
    `,
    [roleName]
  )

  return rows[0] || null
}

export const getAllUsers = async () => {
  const [rows] = await pool.query(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.phone,
        users.department,
        users.status,
        users.last_login_at,
        users.created_at,
        users.updated_at,
        roles.id AS role_id,
        roles.name AS role
      FROM users
      INNER JOIN roles
        ON users.role_id = roles.id
      ORDER BY
        CASE roles.name
          WHEN 'ADMIN' THEN 1
          WHEN 'CEO' THEN 2
          WHEN 'MANAGER' THEN 3
          WHEN 'EMPLOYEE' THEN 4
          ELSE 5
        END,
        users.name ASC
    `
  )

  return rows
}

export const createUser = async ({
  name,
  email,
  phone = null,
  passwordHash,
  roleId,
  department = null,
  status = 'ACTIVE',
}) => {
  const [result] = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        role_id,
        department,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      email,
      phone,
      passwordHash,
      roleId,
      department,
      status,
    ]
  )

  return result.insertId
}



export const updateUserById = async (
  id,
  {
    name,
    email,
    phone = null,
    roleId,
    department = null,
    status,
  }
) => {
  const [result] = await pool.query(
    `
      UPDATE users
      SET
        name = ?,
        email = ?,
        phone = ?,
        role_id = ?,
        department = ?,
        status = ?
      WHERE id = ?
    `,
    [
      name,
      email,
      phone,
      roleId,
      department,
      status,
      id,
    ]
  )

  return result.affectedRows
}

export const updateLastLogin = async (userId) => {
  await pool.query(
    `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ?
    `,
    [userId]
  )
}


export const getActiveEmployees = async () => {
  const [rows] = await pool.query(`
    SELECT
      users.id,
      users.name,
      users.email,
      users.phone,
      users.department,
      users.status
    FROM users
    INNER JOIN roles
      ON users.role_id = roles.id
    WHERE roles.name = 'EMPLOYEE'
      AND users.status = 'ACTIVE'
    ORDER BY users.name ASC
  `)

  return rows
}
export const getActiveTenderOwners = async (companyId) => {
  const [rows] = await pool.query(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.department,
        users.status,
        roles.name AS role,

        COUNT(DISTINCT active_tenders.id) AS active_tender_count

      FROM users

      INNER JOIN roles
        ON users.role_id = roles.id

      INNER JOIN user_companies
        ON user_companies.user_id = users.id

      LEFT JOIN tenders active_tenders
        ON active_tenders.internal_owner_id = users.id
        AND active_tenders.is_active = 1
        AND active_tenders.status NOT IN (
          'COMPLETED',
          'CANCELLED'
        )

      WHERE roles.name = 'MANAGER'
        AND users.status = 'ACTIVE'
        AND user_companies.company_id = ?
        AND user_companies.status = 'ACTIVE'

      GROUP BY
        users.id,
        users.name,
        users.email,
        users.department,
        users.status,
        roles.name

      ORDER BY
        active_tender_count ASC,
        users.name ASC
    `,
    [companyId]
  )

  return rows
}