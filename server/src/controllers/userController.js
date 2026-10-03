import bcrypt from 'bcryptjs'

import {
  getAllUsers,
  findUserByEmail,
  findRoleByName,
  createUser,
  findUserById,
    updateUserById,
} from '../models/userModel.js'

const ALLOWED_ROLES = ['CEO', 'MANAGER', 'EMPLOYEE']
const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE']

// GET /api/users
// ADMIN only
export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers()

    return res.status(200).json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('List users error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve users.',
    })
  }
}

// POST /api/users
// ADMIN only
export const createNewUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      department,
      status = 'ACTIVE',
    } = req.body

    // --------------------------------------------------
    // Required fields
    // --------------------------------------------------
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
      })
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      })
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      })
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required.',
      })
    }

    // --------------------------------------------------
    // Email validation
    // --------------------------------------------------
    const normalizedEmail = email.trim().toLowerCase()

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      })
    }

    // --------------------------------------------------
    // Password validation
    // --------------------------------------------------
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.',
      })
    }

    // --------------------------------------------------
    // Role validation
    // --------------------------------------------------
    const normalizedRole = role.trim().toUpperCase()

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be MANAGER or EMPLOYEE.',
      })
    }

    // --------------------------------------------------
    // Status validation
    // --------------------------------------------------
    const normalizedStatus = status.trim().toUpperCase()

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE or INACTIVE.',
      })
    }

    // --------------------------------------------------
    // Check duplicate email
    // --------------------------------------------------
    const existingUser = await findUserByEmail(normalizedEmail)

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      })
    }

    // --------------------------------------------------
    // Find database role
    // --------------------------------------------------
    const databaseRole = await findRoleByName(normalizedRole)

    if (!databaseRole) {
      return res.status(400).json({
        success: false,
        message: 'Selected role does not exist.',
      })
    }

    // --------------------------------------------------
    // Hash password
    // --------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12)

    // --------------------------------------------------
    // Create user
    // --------------------------------------------------
    const userId = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      passwordHash,
      roleId: databaseRole.id,
      department: department?.trim() || null,
      status: normalizedStatus,
    })

    // Retrieve the safe user record
    const newUser = await findUserById(userId)

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: newUser,
    })
  } catch (error) {
    console.error('Create user error:', error)

    // MySQL duplicate email fallback
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to create user.',
    })
  }
}


// PUT /api/users/:id
// ADMIN only
export const updateExistingUser = async (req, res) => {
  try {
    const { id } = req.params

    const existingUser = await findUserById(id)

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    const {
      name = existingUser.name,
      email = existingUser.email,
      phone = existingUser.phone,
      role = existingUser.role,
      department = existingUser.department,
      status = existingUser.status,
    } = req.body

    // Required fields
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
      })
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      })
    }

    // Email validation
    const normalizedEmail = email.trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      })
    }

    // Role validation
    const normalizedRole = role.trim().toUpperCase()

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be CEO, MANAGER, or EMPLOYEE.',
      })
    }

    // Status validation
    const normalizedStatus = status.trim().toUpperCase()

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE or INACTIVE.',
      })
    }

    // Prevent duplicate email
    const userWithEmail = await findUserByEmail(normalizedEmail)

    if (
      userWithEmail &&
      Number(userWithEmail.id) !== Number(id)
    ) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      })
    }

    // Find database role
    const databaseRole = await findRoleByName(normalizedRole)

    if (!databaseRole) {
      return res.status(400).json({
        success: false,
        message: 'Selected role does not exist.',
      })
    }

    // Update user
    await updateUserById(id, {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      roleId: databaseRole.id,
      department: department?.trim() || null,
      status: normalizedStatus,
    })

    const updatedUser = await findUserById(id)

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update user error:', error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to update user.',
    })
  }
}