import {
  getTenderRequirements,
  getTenderRequirementById,
  createTenderRequirement,
  updateTenderRequirementById,
  deactivateTenderRequirement,
  isUserAssignedToTender,
  getTenderRequirementSummary,
  updateTenderRequirementReview,
} from '../models/tenderRequirementModel.js'

import { getTenderById } from '../models/tenderModel.js'

import pool from '../config/db.js'

import { findUserById } from '../models/userModel.js'

import {
  createTenderActivity,
} from '../models/tenderActivityModel.js'

const allowedRequirementStatuses = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'NOT_APPLICABLE',
]

const normalizeNullableText = (value) => {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

const normalizeNullableId = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const number = Number(value)

  if (!Number.isInteger(number) || number <= 0) {
    return null
  }

  return number
}

/* =========================================================
   LIST REQUIREMENTS
========================================================= */

export const listTenderRequirements = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const requirements =
      await getTenderRequirements(tenderId)

    const summary =
      await getTenderRequirementSummary(tenderId)

    return res.status(200).json({
      success: true,
      count: requirements.length,
      summary,
      data: requirements,
    })
  } catch (error) {
    next(error)
  }
}

/* =========================================================
   CREATE REQUIREMENT
========================================================= */

export const createRequirement = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const {
      category = 'OTHER',
      title,
      description,
      isMandatory = true,
      status = 'NOT_STARTED',
      assignedUserId,
      dueDate,
      sortOrder = 0,
    } = req.body

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Requirement title is required.',
      })
    }

    if (!allowedRequirementStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement status.',
      })
    }

    const numericSortOrder = Number(sortOrder)

    if (
      !Number.isInteger(numericSortOrder) ||
      numericSortOrder < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Sort order must be a non-negative integer.',
      })
    }

    let numericAssignedUserId = null

    if (
      assignedUserId !== undefined &&
      assignedUserId !== null &&
      assignedUserId !== ''
    ) {
      numericAssignedUserId =
        normalizeNullableId(assignedUserId)

      if (!numericAssignedUserId) {
        return res.status(400).json({
          success: false,
          message:
            'Assigned employee ID is invalid.',
        })
      }

      const employee = await findUserById(
        numericAssignedUserId
      )

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            'Assigned employee does not exist.',
        })
      }

      if (employee.role !== 'EMPLOYEE') {
        return res.status(400).json({
          success: false,
          message:
            'Requirement can only be assigned to an employee.',
        })
      }

      if (employee.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message:
            'Requirement cannot be assigned to an inactive employee.',
        })
      }

      const assignedToTender =
        await isUserAssignedToTender(
          tenderId,
          numericAssignedUserId
        )

      if (!assignedToTender) {
        return res.status(400).json({
          success: false,
          message:
            'Employee must be assigned to the tender before assigning this requirement.',
        })
      }
    }

    const requirementId =
      await createTenderRequirement({
        tenderId,
        category:
          normalizeNullableText(category) || 'OTHER',
        title: String(title).trim(),
        description:
          normalizeNullableText(description),
        isMandatory: Boolean(isMandatory),
        status,
        assignedUserId: numericAssignedUserId,
        dueDate: dueDate || null,
        sortOrder: numericSortOrder,
        createdBy: req.user.id,
      })

    const requirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )

    await createTenderActivity({
          tenderId,
          userId: req.user.id,
          actionType: 'REQUIREMENT_CREATED',
          entityType: 'REQUIREMENT',
          entityId: requirementId,
          description: `Requirement "${requirement.title}" was created.`,
          metadata: {
            requirementId,
            title: requirement.title,
            category: requirement.category,
            status: requirement.status,
            assignedUserId:
              requirement.assigned_user_id || null,
          },
        })

    return res.status(201).json({
      success: true,
      message:
        'Tender requirement created successfully.',
      data: requirement,
    })
  } catch (error) {
    next(error)
  }
}

/* =========================================================
   UPDATE REQUIREMENT
========================================================= */

export const updateRequirement = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    const requirementId = Number(
      req.params.requirementId
    )

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    if (
      !Number.isInteger(requirementId) ||
      requirementId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.',
      })
    }

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const existingRequirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )

    if (!existingRequirement) {
      return res.status(404).json({
        success: false,
        message: 'Tender requirement not found.',
      })
    }

    const {
      category = existingRequirement.category,
      title = existingRequirement.title,
      description =
        existingRequirement.description,
      isMandatory =
        Boolean(existingRequirement.is_mandatory),
      status = existingRequirement.status,
      assignedUserId =
        existingRequirement.assigned_user_id,
      dueDate = existingRequirement.due_date,
      sortOrder = existingRequirement.sort_order,
    } = req.body

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Requirement title is required.',
      })
    }

    if (!allowedRequirementStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement status.',
      })
    }

    const numericSortOrder = Number(sortOrder)

    if (
      !Number.isInteger(numericSortOrder) ||
      numericSortOrder < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Sort order must be a non-negative integer.',
      })
    }

    let numericAssignedUserId = null

    if (
      assignedUserId !== undefined &&
      assignedUserId !== null &&
      assignedUserId !== ''
    ) {
      numericAssignedUserId =
        normalizeNullableId(assignedUserId)

      if (!numericAssignedUserId) {
        return res.status(400).json({
          success: false,
          message:
            'Assigned employee ID is invalid.',
        })
      }

      const employee = await findUserById(
        numericAssignedUserId
      )

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            'Assigned employee does not exist.',
        })
      }

      if (employee.role !== 'EMPLOYEE') {
        return res.status(400).json({
          success: false,
          message:
            'Requirement can only be assigned to an employee.',
        })
      }

      if (employee.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message:
            'Requirement cannot be assigned to an inactive employee.',
        })
      }

      const assignedToTender =
        await isUserAssignedToTender(
          tenderId,
          numericAssignedUserId
        )

      if (!assignedToTender) {
        return res.status(400).json({
          success: false,
          message:
            'Employee must be assigned to the tender before assigning this requirement.',
        })
      }
    }

    let completedBy =
      existingRequirement.completed_by

    let completedAt =
      existingRequirement.completed_at

    if (
      status === 'COMPLETED' &&
      existingRequirement.status !== 'COMPLETED'
    ) {
      completedBy = req.user.id
      completedAt = new Date()
    }

    if (
      status !== 'COMPLETED' &&
      existingRequirement.status === 'COMPLETED'
    ) {
      completedBy = null
      completedAt = null
    }

    await updateTenderRequirementById(
      tenderId,
      requirementId,
      {
        category:
          normalizeNullableText(category) || 'OTHER',
        title: String(title).trim(),
        description:
          normalizeNullableText(description),
        isMandatory: Boolean(isMandatory),
        status,
        assignedUserId:
          numericAssignedUserId,
        dueDate: dueDate || null,
        sortOrder: numericSortOrder,
        completedBy,
        completedAt,
      }
    )

    const updatedRequirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )


    const requirementChanges = {
  previousTitle: existingRequirement.title,
  newTitle: updatedRequirement.title,

  previousCategory: existingRequirement.category,
  newCategory: updatedRequirement.category,

  descriptionChanged:
    (existingRequirement.description || '') !==
    (updatedRequirement.description || ''),

  previousMandatory:
    Number(existingRequirement.is_mandatory) === 1,
  newMandatory:
    Number(updatedRequirement.is_mandatory) === 1,

  previousStatus: existingRequirement.status,
  newStatus: updatedRequirement.status,

  previousAssignedUserId:
    existingRequirement.assigned_user_id || null,
  previousAssignedUserName:
    existingRequirement.assigned_user_name || null,

  newAssignedUserId:
    updatedRequirement.assigned_user_id || null,
  newAssignedUserName:
    updatedRequirement.assigned_user_name || null,

  previousDueDate:
    existingRequirement.due_date || null,
  newDueDate:
    updatedRequirement.due_date || null,

  previousSortOrder:
    Number(existingRequirement.sort_order ?? 0),
  newSortOrder:
    Number(updatedRequirement.sort_order ?? 0),
}

await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'REQUIREMENT_UPDATED',
  entityType: 'REQUIREMENT',
  entityId: requirementId,
  description: `Requirement "${updatedRequirement.title}" was updated.`,
  metadata: {
    requirementId,
    ...requirementChanges,
  },
})

    return res.status(200).json({
      success: true,
      message:
        'Tender requirement updated successfully.',
      data: updatedRequirement,
    })
  } catch (error) {
    next(error)
  }
}


export const updateEmployeeRequirementProgress = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    const requirementId = Number(
      req.params.requirementId
    )

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0 ||
      !Number.isInteger(requirementId) ||
      requirementId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender or requirement ID.',
      })
    }

    const requirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Tender requirement not found.',
      })
    }

    // Employee can update only a requirement
    // specifically assigned to them.
    

    const { status } = req.body

    const employeeAllowedStatuses = [
      'NOT_STARTED',
      'IN_PROGRESS',
      'COMPLETED',
    ]

    if (!employeeAllowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          'Employees can only set Not Started, In Progress, or Completed.',
      })
    }

    let completedBy =
      requirement.completed_by

    let completedAt =
      requirement.completed_at

    if (
      status === 'COMPLETED' &&
      requirement.status !== 'COMPLETED'
    ) {
      completedBy = req.user.id
      completedAt = new Date()
    }

    if (
      status !== 'COMPLETED' &&
      requirement.status === 'COMPLETED'
    ) {
      completedBy = null
      completedAt = null
    }

    await updateTenderRequirementById(
      tenderId,
      requirementId,
      {
        category: requirement.category,
        title: requirement.title,
        description: requirement.description,
        isMandatory:
          Boolean(requirement.is_mandatory),
        status,
        assignedUserId:
          requirement.assigned_user_id,
        dueDate: requirement.due_date || null,
        sortOrder: requirement.sort_order,
        completedBy,
        completedAt,
      }
    )

    // =========================================================
// AUTOMATIC REVIEW STATUS TRANSITION
// =========================================================

if (
  status === 'COMPLETED' &&
  requirement.status !== 'COMPLETED'
) {
  await updateTenderRequirementReview(
    tenderId,
    requirementId,
    {
      reviewStatus: 'AWAITING_REVIEW',
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
    }
  )
} else if (
  status !== 'COMPLETED' &&
  requirement.review_status !== 'CHANGES_REQUESTED' &&
  (
    requirement.status === 'COMPLETED' ||
    requirement.review_status !== 'NOT_SUBMITTED'
  )
) {
  await updateTenderRequirementReview(
    tenderId,
    requirementId,
    {
      reviewStatus: 'NOT_SUBMITTED',
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
    }
  )
}

    const updatedRequirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )

    await createTenderActivity({
        tenderId,
        userId: req.user.id,
        actionType: 'REQUIREMENT_PROGRESS_UPDATED',
        entityType: 'REQUIREMENT',
        entityId: requirementId,
        description:
          `Requirement "${updatedRequirement.title}" status changed from ` +
          `${requirement.status} to ${updatedRequirement.status}.`,
        metadata: {
          requirementId,
          title: updatedRequirement.title,
          previousStatus: requirement.status,
          newStatus: updatedRequirement.status,
        },
      })

    return res.status(200).json({
      success: true,
      message:
        'Requirement progress updated successfully.',
      data: updatedRequirement,
    })
  } catch (error) {
    next(error)
  }
}

/* =========================================================
   REMOVE REQUIREMENT
========================================================= */

export const removeRequirement = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.tenderId)

    const requirementId = Number(
      req.params.requirementId
    )

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    if (
      !Number.isInteger(requirementId) ||
      requirementId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.',
      })
    }

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const requirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Tender requirement not found.',
      })
    }

   await deactivateTenderRequirement(
  tenderId,
  requirementId
)

// Archive all active documents linked to this requirement.
// Physical files are intentionally retained for audit/history.
await pool.execute(
  `
    UPDATE tender_documents
    SET is_active = 0
    WHERE tender_id = ?
      AND requirement_id = ?
      AND is_active = 1
  `,
  [tenderId, requirementId]
)


await createTenderActivity({
  tenderId,
  userId: req.user.id,
  actionType: 'REQUIREMENT_ARCHIVED',
  entityType: 'REQUIREMENT',
  entityId: requirementId,
  description: `Requirement "${requirement.title}" was archived.`,
  metadata: {
    requirementId,
    title: requirement.title,
    category: requirement.category,
    status: requirement.status,
    assignedUserId:
      requirement.assigned_user_id || null,
  },
})

    return res.status(200).json({
      success: true,
      message:
        'Tender requirement removed successfully.',
    })
  } catch (error) {
    next(error)
  }
}