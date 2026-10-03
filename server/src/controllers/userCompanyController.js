import {
  getUserCompanies,
  findActiveUserCompany,
  addUserToCompany,
  updateUserCompany,
  deactivateUserCompany,
  activateUserCompany,
  getUserCompanyPermissions,
  findUserCompanyPermission,
  grantCompanyPermission,
  revokeCompanyPermission,
  findUserCompany,
} from '../models/userCompanyModel.js'

import { findUserById } from '../models/userModel.js'
import { findCompanyById } from '../models/companyModel.js'

const parsePositiveId = (value) => {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return id
}

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value === 'true' || value === 1 || value === '1') {
    return true
  }

  if (value === 'false' || value === 0 || value === '0') {
    return false
  }

  return null
}


// ======================================================
// MEMBERSHIP
// ======================================================

// GET /api/users/:userId/companies
export const listUserCompanies = async (req, res) => {
  try {
    const userId = parsePositiveId(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      })
    }

    const user = await findUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    const companies = await getUserCompanies(userId)

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      companies,
    })
  } catch (error) {
    console.error('List user companies error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve user companies.',
    })
  }
}


// POST /api/users/:userId/companies
// ADMIN only for now
export const assignUserToCompany = async (req, res) => {
  try {
    const userId = parsePositiveId(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      })
    }

    const {
      companyId,
      isPrimary = false,
      activeFrom = null,
    } = req.body

    const parsedCompanyId = parsePositiveId(companyId)

    if (!parsedCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Valid companyId is required.',
      })
    }

    const parsedIsPrimary = parseBoolean(isPrimary)

    if (parsedIsPrimary === null) {
      return res.status(400).json({
        success: false,
        message: 'isPrimary must be true or false.',
      })
    }

    const user = await findUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }


    if (!['CEO', 'MANAGER'].includes(user.role)) {
  return res.status(400).json({
    success: false,
    message:
      'Company assignments are only available for CEO and MANAGER users.',
  })
}

    const company = await findCompanyById(parsedCompanyId)

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      })
    }

    if (company.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign user to an inactive company.',
      })
    }

   const existingMembership =
  await findUserCompany(userId, companyId)

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        return res.status(409).json({
          success: false,
          message: 'User is already assigned to this company.',
        })
      }

      return res.status(409).json({
        success: false,
        message:
          'This company membership already exists but is inactive. Reactivate the existing membership instead.',
      })
    }

    await addUserToCompany({
      userId,
      companyId: parsedCompanyId,
      isPrimary: parsedIsPrimary,
      activeFrom,
    })

    const companies = await getUserCompanies(userId)

    return res.status(201).json({
      success: true,
      message: 'User assigned to company successfully.',
      companies,
    })
  } catch (error) {
    console.error('Assign user to company error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to assign user to company.',
    })
  }
}


// PUT /api/users/:userId/companies/:companyId
// Change primary flag / activeFrom
export const updateUserCompanyMembership = async (
  req,
  res
) => {
  try {
    const userId = parsePositiveId(req.params.userId)
    const companyId = parsePositiveId(req.params.companyId)

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or company ID.',
      })
    }

    const user = await findUserById(userId)

if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found.',
  })
}

if (!['CEO', 'MANAGER'].includes(user.role)) {
  return res.status(400).json({
    success: false,
    message:
      'Company assignments are only available for CEO and MANAGER users.',
  })
}

    const membership = await findActiveUserCompany(
      userId,
      companyId
    )

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Active company membership not found.',
      })
    }

    const {
      isPrimary,
      activeFrom,
    } = req.body

    let parsedIsPrimary

    if (isPrimary !== undefined) {
      parsedIsPrimary = parseBoolean(isPrimary)

      if (parsedIsPrimary === null) {
        return res.status(400).json({
          success: false,
          message: 'isPrimary must be true or false.',
        })
      }
    }

    if (
      isPrimary === undefined &&
      activeFrom === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Provide isPrimary or activeFrom to update.',
      })
    }

    await updateUserCompany({
      userId,
      companyId,
      isPrimary: parsedIsPrimary,
      activeFrom,
    })

    const companies = await getUserCompanies(userId)

    return res.status(200).json({
      success: true,
      message: 'Company membership updated successfully.',
      companies,
    })
  } catch (error) {
    console.error(
      'Update user company membership error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to update company membership.',
    })
  }
}


// DELETE /api/users/:userId/companies/:companyId
// Deactivates instead of deleting history
export const removeUserFromCompany = async (req, res) => {
  try {
    const userId = parsePositiveId(req.params.userId)
    const companyId = parsePositiveId(req.params.companyId)

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or company ID.',
      })
    }

    const user = await findUserById(userId)

if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found.',
  })
}

if (!['CEO', 'MANAGER'].includes(user.role)) {
  return res.status(400).json({
    success: false,
    message:
      'Company assignments are only available for CEO and MANAGER users.',
  })
}

    const membership = await findActiveUserCompany(
      userId,
      companyId
    )

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Active company membership not found.',
      })
    }

    const { activeTo = null } = req.body || {}

    await deactivateUserCompany({
      userId,
      companyId,
      activeTo,
    })

    const companies = await getUserCompanies(userId)

    return res.status(200).json({
      success: true,
      message: 'User removed from company successfully.',
      companies,
    })
  } catch (error) {
    console.error('Remove user from company error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to remove user from company.',
    })
  }
}




// PATCH /api/users/:userId/companies/:companyId/activate
// Reactivates an existing inactive membership
export const activateUserCompanyMembership = async (req, res) => {
  try {
    const userId = parsePositiveId(req.params.userId)
    const companyId = parsePositiveId(req.params.companyId)

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or company ID.',
      })
    }

    const user = await findUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    if (!['CEO', 'MANAGER'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message:
          'Company assignments are only available for CEO and MANAGER users.',
      })
    }

    const company = await findCompanyById(companyId)

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      })
    }

    if (company.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate membership for an inactive company.',
      })
    }

    const affectedRows = await activateUserCompany({
      userId,
      companyId,
    })

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inactive company membership not found.',
      })
    }

    const companies = await getUserCompanies(userId)

    return res.status(200).json({
      success: true,
      message: 'Company membership activated successfully.',
      companies,
    })
  } catch (error) {
    console.error(
      'Activate user company membership error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to activate company membership.',
    })
  }
}

// ======================================================
// COMPANY PERMISSIONS / DELEGATION
// ======================================================

// GET /api/users/:userId/company-permissions
export const listUserCompanyPermissions = async (
  req,
  res
) => {
  try {
    const userId = parsePositiveId(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      })
    }

    const user = await findUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    const permissions =
      await getUserCompanyPermissions(userId)

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      permissions,
    })
  } catch (error) {
    console.error(
      'List company permissions error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve company permissions.',
    })
  }
}


// POST /api/users/:userId/company-permissions
export const assignCompanyPermission = async (
  req,
  res
) => {
  try {
    const userId = parsePositiveId(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      })
    }

    const {
      companyId,
      canView = true,
      canManage = false,
      canViewMetrics = false,
    } = req.body

    const parsedCompanyId = parsePositiveId(companyId)

    if (!parsedCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Valid companyId is required.',
      })
    }

    const parsedCanView = parseBoolean(canView, true)
    const parsedCanManage = parseBoolean(canManage, false)
    const parsedCanViewMetrics = parseBoolean(
      canViewMetrics,
      false
    )

    if (
      parsedCanView === null ||
      parsedCanManage === null ||
      parsedCanViewMetrics === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Permission values must be true or false.',
      })
    }

    const user = await findUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    if (
      !['CEO', 'MANAGER'].includes(user.role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Company management permissions can only be assigned to CEO or MANAGER users.',
      })
    }

    const company = await findCompanyById(parsedCompanyId)

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      })
    }

    if (company.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot grant access to an inactive company.',
      })
    }

    await grantCompanyPermission({
      userId,
      companyId: parsedCompanyId,
      canView: parsedCanView,
      canManage: parsedCanManage,
      canViewMetrics: parsedCanViewMetrics,
      grantedBy: req.user.id,
    })

    const permissions =
      await getUserCompanyPermissions(userId)

    return res.status(200).json({
      success: true,
      message:
        'Company permission assigned successfully.',
      permissions,
    })
  } catch (error) {
    console.error(
      'Assign company permission error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to assign company permission.',
    })
  }
}


// DELETE /api/users/:userId/company-permissions/:companyId
export const removeCompanyPermission = async (
  req,
  res
) => {
  try {
    const userId = parsePositiveId(req.params.userId)
    const companyId = parsePositiveId(req.params.companyId)

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or company ID.',
      })
    }

    const permission =
      await findUserCompanyPermission(userId, companyId)

    if (!permission || permission.revoked_at) {
      return res.status(404).json({
        success: false,
        message: 'Active company permission not found.',
      })
    }

    await revokeCompanyPermission({
      userId,
      companyId,
    })

    const permissions =
      await getUserCompanyPermissions(userId)

    return res.status(200).json({
      success: true,
      message:
        'Company permission revoked successfully.',
      permissions,
    })
  } catch (error) {
    console.error(
      'Remove company permission error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to revoke company permission.',
    })
  }
}