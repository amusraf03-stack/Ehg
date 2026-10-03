import express from 'express'

import {
  listTenders,
  getTenderDetails,
  createNewTender,
  updateTender,
  assignTender,
  removeTenderTeamMember,
  listAssignableEmployees,
  listInternalOwners,
  listMyAssignedTenders,
  archiveTender,
  
} from '../controllers/tenderController.js'


import {
  getTenderReviewDashboard,
  reviewTenderRequirement,
  reviewTenderCompliance,
} from '../controllers/tenderReviewController.js'


import {
  requireTenderAccess,
} from '../middleware/tenderAccessMiddleware.js'

import {
  listTenderCompliance,
  applyDefaultComplianceTemplate,
  createComplianceItem,
  updateComplianceItem,
  removeComplianceItem,
  updateEmployeeComplianceProgress,
  getComplianceTemplateOptions,
} from '../controllers/tenderComplianceController.js'

import {
  listTenderRequirements,
  createRequirement,
  updateRequirement,
  removeRequirement,
  updateEmployeeRequirementProgress
} from '../controllers/tenderRequirementController.js'


import {
  listTenderDocuments,
  uploadTenderDocument,
  editTenderDocument,
  downloadTenderDocument,
  removeTenderDocument,
  previewTenderDocument
} from '../controllers/tenderDocumentController.js'

import {
  listTenderInternalNotes,
  addTenderInternalNote,
  editTenderInternalNote,
  deleteTenderInternalNote,
} from '../controllers/tenderInternalNoteController.js'



import {
  listTenderActivities,
} from '../controllers/tenderActivityController.js'

import {
  tenderDocumentUpload,
} from '../config/documentUpload.js'


import {
  getTenderSubmission,
  submitTender,
} from '../controllers/tenderSubmissionController.js'

import { protect } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'

const router = express.Router()

// All tender routes require authentication
router.use(protect)


router.get(
  '/assignable-employees',
  requireRole('ADMIN', 'MANAGER'),
  listAssignableEmployees
)

router.get(
  '/assigned',
  requireRole('EMPLOYEE'),
  listMyAssignedTenders
)

// ADMIN + ceo + MANAGER can view all tenders
router.get(
  '/',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  listTenders
)

router.get(
  '/internal-owners',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  listInternalOwners
)


// ADMIN + CEO + MANAGER can view requirements
router.get(
  '/:tenderId/requirements',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderRequirements
)

// ADMIN + MANAGER can create requirements
router.post(
  '/:tenderId/requirements',
  requireRole('ADMIN', 'MANAGER'),
  createRequirement
)

// ADMIN + MANAGER can update requirements
router.put(
  '/:tenderId/requirements/:requirementId',
  requireRole('ADMIN', 'MANAGER'),
  updateRequirement
)


router.get(
  '/:tenderId/compliance',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderCompliance
)

router.get(
  '/:tenderId/compliance/template-options',
  requireRole(
    'ADMIN',
    'MANAGER'
  ),
  getComplianceTemplateOptions
)

router.post(
  '/:tenderId/compliance/apply-template',
  requireRole('ADMIN', 'MANAGER'),
  applyDefaultComplianceTemplate
)

router.post(
  '/:tenderId/compliance',
  requireRole('ADMIN', 'MANAGER'),
  createComplianceItem
)

router.put(
  '/:tenderId/compliance/:complianceItemId',
  requireRole('ADMIN', 'MANAGER'),
  updateComplianceItem
)

router.delete(
  '/:tenderId/compliance/:complianceItemId',
  requireRole('ADMIN', 'MANAGER'),
  removeComplianceItem
)

router.patch(
  '/:tenderId/compliance/:complianceItemId/progress',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  updateEmployeeComplianceProgress
)

// --------------------------------------------------
// Tender Documents
// --------------------------------------------------

// List documents
router.get(
  '/:tenderId/documents',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderDocuments
)
// Upload document
router.post(
  '/:tenderId/documents',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE',
    'CEO'
  ),
  requireTenderAccess,
  tenderDocumentUpload.single('file'),
  uploadTenderDocument
)

// Edit document metadata and optionally replace file

// Edit document metadata and optionally replace file
router.put(
  '/:tenderId/documents/:documentId',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  tenderDocumentUpload.single('file'),
  editTenderDocument
)

// Download document
router.get(
  '/:tenderId/documents/:documentId/download',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  downloadTenderDocument
)

router.get(
  '/:tenderId/documents/:documentId/preview',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  previewTenderDocument
)


// Remove document
router.delete(
  '/:tenderId/documents/:documentId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE',
    'CEO'
  ),
  requireTenderAccess,
  removeTenderDocument
)

//tender internal notes
//tender internal notes
router.get(
  '/:tenderId/internal-notes',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderInternalNotes
)

router.post(
  '/:tenderId/internal-notes',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  addTenderInternalNote
)

router.put(
  '/:tenderId/internal-notes/:noteId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  editTenderInternalNote
)
router.delete(
  '/:tenderId/internal-notes/:noteId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  deleteTenderInternalNote
)





//tender activity

router.get(
  '/:tenderId/activity',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderActivities
)





// --------------------------------------------------
// Tender Review & Approval
// --------------------------------------------------

// Review dashboard
router.get(
  '/:tenderId/review',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER'
  ),
  requireTenderAccess,
  getTenderReviewDashboard
)

// Review Requirement
router.patch(
  '/:tenderId/review/requirements/:requirementId',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER'
  ),
  requireTenderAccess,
  reviewTenderRequirement
)

// Review Compliance item
router.patch(
  '/:tenderId/review/compliance/:complianceItemId',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER'
  ),
  requireTenderAccess,
  reviewTenderCompliance
)

// ADMIN + CEO +MANAGER can view tender details
router.get(
  '/:id',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  getTenderDetails
)


router.patch(
  '/:tenderId/requirements/:requirementId/progress',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  updateEmployeeRequirementProgress
)




// --------------------------------------------------
// Final Submission
// ADMIN / CEO only
// --------------------------------------------------

// Get Final Submission information
router.get(
  '/:tenderId/submission',
  requireRole(
    'ADMIN',
    'CEO'
  ),
  requireTenderAccess,
  getTenderSubmission
)

// Mark tender as submitted
router.patch(
  '/:tenderId/submission',
  requireRole(
    'ADMIN',
    'CEO'
  ),
  requireTenderAccess,
  submitTender
)







// ADMIN + MANAGER can create tenders
router.post(
  '/',
  requireRole('ADMIN'),
  createNewTender
)

// ADMIN + MANAGER can update tenders
router.put(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  updateTender
)

// ADMIN + MANAGER can archive tenders
router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  archiveTender
)

// ADMIN + MANAGER can assign employees
router.post(
  '/:id/assign',
  requireRole('ADMIN', 'MANAGER'),
  assignTender
)

// ADMIN + MANAGER can remove employees from tender team

router.delete(
  '/:id/assign/:userId',
  requireRole('ADMIN', 'MANAGER'),
  removeTenderTeamMember
)

export default router