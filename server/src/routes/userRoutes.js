import express from 'express'
import {
  listUsers,
  createNewUser,
  updateExistingUser,
} from '../controllers/userController.js'

import { protect } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
  listUserCompanies,
  assignUserToCompany,
  updateUserCompanyMembership,
  removeUserFromCompany,
  listUserCompanyPermissions,
  assignCompanyPermission,
  removeCompanyPermission,
  activateUserCompanyMembership,
} from '../controllers/userCompanyController.js'

const router = express.Router()

router.use(protect)

router.get('/', requireRole('ADMIN','CEO'), listUsers)

router.post('/', requireRole('ADMIN'), createNewUser)


router.put('/:id', requireRole('ADMIN'), updateExistingUser)

// ======================================================
// USER ↔ COMPANY MEMBERSHIP
// ======================================================

// Admin / CEO / Manager can view company memberships
router.get(
  '/:userId/companies',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  listUserCompanies
)

// Admin manages membership structure for now
router.post(
  '/:userId/companies',
  requireRole('ADMIN'),
  assignUserToCompany
)

router.put(
  '/:userId/companies/:companyId',
  requireRole('ADMIN'),
  updateUserCompanyMembership
)

router.delete(
  '/:userId/companies/:companyId',
  requireRole('ADMIN'),
  removeUserFromCompany
)

router.patch(
  '/:userId/companies/:companyId/activate',
  requireRole('ADMIN'),
  activateUserCompanyMembership
)

// ======================================================
// COMPANY ACCESS / DELEGATION
// ======================================================

// Admin / CEO can inspect permissions
router.get(
  '/:userId/company-permissions',
  requireRole('ADMIN', 'CEO'),
  listUserCompanyPermissions
)

// Admin / CEO can delegate company access
router.post(
  '/:userId/company-permissions',
  requireRole('ADMIN', 'CEO'),
  assignCompanyPermission
)

// Admin / CEO can revoke delegated access
router.delete(
  '/:userId/company-permissions/:companyId',
  requireRole('ADMIN', 'CEO'),
  removeCompanyPermission
)

export default router