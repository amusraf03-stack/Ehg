
import {
  createTenderActivity,
} from '../models/tenderActivityModel.js'


import {
  getAllTenders,
  getTenderById,
  createTender,
  updateTenderById,
  assignTenderToEmployee,
  getTenderAssignments,
  getAssignedTendersByUserId,
  removeTenderAssignment,
   archiveTenderById,
   getTenderEmployeeById,
} from '../models/tenderModel.js'

import {
  findUserById,
  getActiveEmployees,
  getActiveTenderOwners,
} from '../models/userModel.js'

import { findCompanyById } from '../models/companyModel.js'

const allowedStatuses = [
  'DRAFT',
  'PREPARATION',
  'IN_PROGRESS',
  'REVIEW',
  'SUBMITTED',
  'COMPLETED',
  'CANCELLED',
]

const allowedResults = [
  'PENDING',
  'WON',
  'LOST',
  'CANCELLED',
]

const allowedPriorities = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]

const allowedInternalOwnerRoles = [
  'ADMIN',
  'CEO',
  'MANAGER',
]

const normalizeNullableText = (value) => {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

const normalizeNullableNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

/* =========================================================
   LIST ALL TENDERS
========================================================= */

export const listTenders = async (req, res, next) => {
  try {
    const tenders = await getAllTenders()

    return res.status(200).json({
      success: true,
      count: tenders.length,
      data: tenders,
    })
  } catch (error) {
    next(error)
  }
}

/* =========================================================
   GET ONE TENDER
========================================================= */

export const getTenderDetails = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.id)

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

    const assignments =
      await getTenderAssignments(tenderId)

    return res.status(200).json({
      success: true,
      data: {
        ...tender,
        assignments,
      },
    })
  } catch (error) {
    next(error)
  }
}

/* =========================================================
   CREATE TENDER
========================================================= */

export const createNewTender = async (
  req,
  res,
  next
) => {
  try {
    const {
      companyId,
      referenceNo,
      title,
      clientName,
      description,
      category,
      status = 'DRAFT',
      priority = 'MEDIUM',
      tenderValue,
      result = 'PENDING',
      progress = 0,
      startDate,
      deadline,
      closingTime,
      internalDeadline,
      submissionMethod,
      submissionLocation,
   
      submittedAt,
    } = req.body

    /* -----------------------------
       Required fields
    ----------------------------- */

    if (
      !referenceNo ||
      !String(referenceNo).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Tender reference number is required.',
      })
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tender title is required.',
      })
    }

    /* -----------------------------
       Status
    ----------------------------- */

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender status.',
      })
    }

    /* -----------------------------
       Priority
    ----------------------------- */

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender priority.',
      })
    }

    /* -----------------------------
       Result
    ----------------------------- */

    if (!allowedResults.includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender result.',
      })
    }

    /* -----------------------------
       Tender Value
    ----------------------------- */

    const numericTenderValue =
      normalizeNullableNumber(tenderValue)

    if (
      tenderValue !== undefined &&
      tenderValue !== null &&
      tenderValue !== '' &&
      numericTenderValue === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Tender value must be a valid number.',
      })
    }

    if (
      numericTenderValue !== null &&
      numericTenderValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Tender value cannot be negative.',
      })
    }

    /* -----------------------------
       Progress
    ----------------------------- */

    const numericProgress = Number(progress)

    if (
      !Number.isInteger(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Progress must be an integer between 0 and 100.',
      })
    }

    /* -----------------------------
       Dates
    ----------------------------- */

    if (
      startDate &&
      deadline &&
      new Date(deadline) < new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Deadline cannot be earlier than start date.',
      })
    }

    /* -----------------------------
       Company
    ----------------------------- */

    const numericCompanyId =
      companyId === undefined ||
      companyId === null ||
      companyId === ''
        ? null
        : Number(companyId)

    if (
      numericCompanyId !== null &&
      (!Number.isInteger(numericCompanyId) ||
        numericCompanyId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.',
      })
    }

    if (numericCompanyId !== null) {
      const company = await findCompanyById(
        numericCompanyId
      )

      if (!company) {
        return res.status(404).json({
          success: false,
          message:
            'Selected company does not exist.',
        })
      }

      if (company.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message:
            'Tender cannot be assigned to an inactive company.',
        })
      }
    }

   
    /* -----------------------------
       Create Tender
    ----------------------------- */

    const tenderId = await createTender({
      companyId: numericCompanyId,
      referenceNo: String(
        referenceNo
      ).trim(),
      title: String(title).trim(),
      clientName:
        normalizeNullableText(clientName),
      description:
        normalizeNullableText(description),
      category:
        normalizeNullableText(category),
      status,
      priority,
      tenderValue: numericTenderValue,
      result,
      progress: numericProgress,
      startDate: startDate || null,
      deadline: deadline || null,
      closingTime: closingTime || null,
      internalDeadline:
        internalDeadline || null,
      submissionMethod:
        normalizeNullableText(
          submissionMethod
        ),
      submissionLocation:
        normalizeNullableText(
          submissionLocation
        ),
      internalOwnerId: req.user.id,
      submittedAt: submittedAt || null,
      createdBy: req.user.id,
    })

    const tender =
      await getTenderById(tenderId)


    await createTenderActivity({
        tenderId,
        userId: req.user.id,
        actionType: 'TENDER_CREATED',
        entityType: 'TENDER',
        entityId: tenderId,
        description: `Tender "${tender.title}" was created.`,
        metadata: {
          tenderId,
          title: tender.title,
          referenceNo: tender.reference_no,
          companyId: tender.company_id || null,
          companyName: tender.company_name || null,
          status: tender.status,
          priority: tender.priority,
        },
      })

    return res.status(201).json({
      success: true,
      message:
        'Tender created successfully.',
      data: tender,
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message:
          'Tender reference number already exists.',
      })
    }

    next(error)
  }
}

/* =========================================================
   UPDATE TENDER
========================================================= */

export const updateTender = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.id)

    if (
      !Number.isInteger(tenderId) ||
      tenderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const existingTender =
      await getTenderById(tenderId)

    if (!existingTender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const {
      companyId = existingTender.company_id,
      referenceNo =
        existingTender.reference_no,
      title = existingTender.title,
      clientName =
        existingTender.client_name,
      description =
        existingTender.description,
      category = existingTender.category,
      status = existingTender.status,
      priority = existingTender.priority,
      tenderValue =
        existingTender.tender_value,
      result = existingTender.result,
      progress = existingTender.progress,
      startDate =
        existingTender.start_date,
      deadline = existingTender.deadline,
      closingTime =
        existingTender.closing_time,
      internalDeadline =
        existingTender.internal_deadline,
      submissionMethod =
        existingTender.submission_method,
      submissionLocation =
        existingTender.submission_location,
      internalOwnerId =
        existingTender.internal_owner_id,
      submittedAt =
        existingTender.submitted_at,
    } = req.body

    /* -----------------------------
       Required fields
    ----------------------------- */

    if (
      !referenceNo ||
      !String(referenceNo).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Tender reference number is required.',
      })
    }

    if (
      !title ||
      !String(title).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tender title is required.',
      })
    }

    /* -----------------------------
       Status
    ----------------------------- */

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender status.',
      })
    }

    /* -----------------------------
       Priority
    ----------------------------- */

    if (
      !allowedPriorities.includes(
        priority
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender priority.',
      })
    }

    /* -----------------------------
       Result
    ----------------------------- */

    if (!allowedResults.includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender result.',
      })
    }

    /* -----------------------------
       Tender Value
    ----------------------------- */

    const numericTenderValue =
      normalizeNullableNumber(tenderValue)

    if (
      tenderValue !== undefined &&
      tenderValue !== null &&
      tenderValue !== '' &&
      numericTenderValue === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Tender value must be a valid number.',
      })
    }

    if (
      numericTenderValue !== null &&
      numericTenderValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Tender value cannot be negative.',
      })
    }

    /* -----------------------------
       Progress
    ----------------------------- */

    const numericProgress =
      Number(progress)

    if (
      !Number.isInteger(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Progress must be an integer between 0 and 100.',
      })
    }

    /* -----------------------------
       Dates
    ----------------------------- */

    if (
      startDate &&
      deadline &&
      new Date(deadline) <
        new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Deadline cannot be earlier than start date.',
      })
    }

    /* -----------------------------
       Company
    ----------------------------- */

    const numericCompanyId =
      companyId === undefined ||
      companyId === null ||
      companyId === ''
        ? null
        : Number(companyId)

    if (
      numericCompanyId !== null &&
      (!Number.isInteger(numericCompanyId) ||
        numericCompanyId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.',
      })
    }

    if (numericCompanyId !== null) {
      const company =
        await findCompanyById(
          numericCompanyId
        )

      if (!company) {
        return res.status(404).json({
          success: false,
          message:
            'Selected company does not exist.',
        })
      }

      if (company.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message:
            'Tender cannot be assigned to an inactive company.',
        })
      }
    }

    /* -----------------------------
       Internal Owner
    ----------------------------- */

    const numericInternalOwnerId =
      internalOwnerId === undefined ||
      internalOwnerId === null ||
      internalOwnerId === ''
        ? null
        : Number(internalOwnerId)

    if (
      numericInternalOwnerId !== null &&
      (!Number.isInteger(
        numericInternalOwnerId
      ) ||
        numericInternalOwnerId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid internal owner ID.',
      })
    }

    if (numericInternalOwnerId !== null) {
      const internalOwner =
        await findUserById(
          numericInternalOwnerId
        )

      if (!internalOwner) {
        return res.status(404).json({
          success: false,
          message:
            'Selected internal owner does not exist.',
        })
      }

      if (
        internalOwner.status !== 'ACTIVE'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Internal owner must be an active user.',
        })
      }

      if (
        !allowedInternalOwnerRoles.includes(
          internalOwner.role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Internal owner must be an Admin, CEO, or Manager.',
        })
      }
    }

    /* -----------------------------
       Update Tender
    ----------------------------- */

    await updateTenderById(tenderId, {
      companyId: numericCompanyId,
      referenceNo: String(
        referenceNo
      ).trim(),
      title: String(title).trim(),
      clientName:
        normalizeNullableText(clientName),
      description:
        normalizeNullableText(description),
      category:
        normalizeNullableText(category),
      status,
      priority,
      tenderValue: numericTenderValue,
      result,
      progress: numericProgress,
      startDate: startDate || null,
      deadline: deadline || null,
      closingTime: closingTime || null,
      internalDeadline:
        internalDeadline || null,
      submissionMethod:
        normalizeNullableText(
          submissionMethod
        ),
      submissionLocation:
        normalizeNullableText(
          submissionLocation
        ),
      internalOwnerId:
        numericInternalOwnerId,
      submittedAt: submittedAt || null,
    })

    const updatedTender =
      await getTenderById(tenderId)


    // --------------------------------------------------
    // Activity log - tender updated
    // --------------------------------------------------

    const tenderChanges = {
      previousCompanyId:
        existingTender.company_id || null,
      previousCompanyName:
        existingTender.company_name || null,
      newCompanyId:
        updatedTender.company_id || null,
      newCompanyName:
        updatedTender.company_name || null,

      previousReferenceNo:
        existingTender.reference_no,
      newReferenceNo:
        updatedTender.reference_no,

      previousTitle:
        existingTender.title,
      newTitle:
        updatedTender.title,

      previousClientName:
        existingTender.client_name || null,
      newClientName:
        updatedTender.client_name || null,

      descriptionChanged:
        (existingTender.description || '') !==
        (updatedTender.description || ''),

      previousCategory:
        existingTender.category || null,
      newCategory:
        updatedTender.category || null,

      previousStatus:
        existingTender.status,
      newStatus:
        updatedTender.status,

      previousPriority:
        existingTender.priority,
      newPriority:
        updatedTender.priority,

      previousTenderValue:
        existingTender.tender_value ?? null,
      newTenderValue:
        updatedTender.tender_value ?? null,

      previousResult:
        existingTender.result,
      newResult:
        updatedTender.result,

      previousProgress:
        Number(existingTender.progress ?? 0),
      newProgress:
        Number(updatedTender.progress ?? 0),

      previousStartDate:
        existingTender.start_date || null,
      newStartDate:
        updatedTender.start_date || null,

      previousDeadline:
        existingTender.deadline || null,
      newDeadline:
        updatedTender.deadline || null,

      previousClosingTime:
        existingTender.closing_time || null,
      newClosingTime:
        updatedTender.closing_time || null,

      previousInternalDeadline:
        existingTender.internal_deadline || null,
      newInternalDeadline:
        updatedTender.internal_deadline || null,

      previousSubmissionMethod:
        existingTender.submission_method || null,
      newSubmissionMethod:
        updatedTender.submission_method || null,

      previousSubmissionLocation:
        existingTender.submission_location || null,
      newSubmissionLocation:
        updatedTender.submission_location || null,

      previousInternalOwnerId:
        existingTender.internal_owner_id || null,
      previousInternalOwnerName:
        existingTender.internal_owner_name || null,
      newInternalOwnerId:
        updatedTender.internal_owner_id || null,
      newInternalOwnerName:
        updatedTender.internal_owner_name || null,

      previousSubmittedAt:
        existingTender.submitted_at || null,
      newSubmittedAt:
        updatedTender.submitted_at || null,
    }

    await createTenderActivity({
      tenderId,
      userId: req.user.id,
      actionType: 'TENDER_UPDATED',
      entityType: 'TENDER',
      entityId: tenderId,
      description:
        `Tender "${updatedTender.title}" was updated.`,
      metadata: tenderChanges,
    })

    return res.status(200).json({
      success: true,
      message:
        'Tender updated successfully.',
      data: updatedTender,
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message:
          'Tender reference number already exists.',
      })
    }

    next(error)
  }
}

/* =========================================================
   ASSIGN EMPLOYEE TO TENDER
========================================================= */

export const assignTender = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(
      req.params.id
    )

    const userId = Number(
      req.body.userId
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
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'A valid employee user ID is required.',
      })
    }

    const tender =
      await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const employee =
      await findUserById(userId)

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          'Selected user does not exist.',
      })
    }

    if (employee.role !== 'EMPLOYEE') {
      return res.status(400).json({
        success: false,
        message:
          'Tenders can only be assigned to employees.',
      })
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message:
          'Tender cannot be assigned to an inactive employee.',
      })
    }

    const assignmentId =
      await assignTenderToEmployee({
        tenderId,
        userId,
        assignedBy: req.user.id,
      })

    const assignedEmployee =
      await getTenderEmployeeById(userId)

    
      await createTenderActivity({
        tenderId,
        userId: req.user.id,
        actionType: 'EMPLOYEE_ASSIGNED',
        entityType: 'ASSIGNMENT',
        entityId: assignmentId,
        description: assignedEmployee
          ? `${assignedEmployee.name} was assigned to this tender.`
          : 'Employee assigned to tender.',
        metadata: {
          assignedUserId: userId,
          assignedUserName:
            assignedEmployee?.name || null,
        },
      })

    const assignments =
      await getTenderAssignments(tenderId)

    return res.status(201).json({
      success: true,
      message:
        'Tender assigned successfully.',
      data: {
        assignmentId,
        tenderId,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department:
            employee.department,
        },
        assignedBy: req.user.id,
        assignments,
      },
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message:
          'This employee is already assigned to this tender.',
      })
    }

    next(error)
  }
}





/* =========================================================
   REMOVE EMPLOYEE FROM TENDER
========================================================= */

export const removeTenderTeamMember = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.id)
    const userId = Number(req.params.userId)

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
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee user ID.',
      })
    }

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    const removedEmployee =
      await getTenderEmployeeById(userId)

    const removed = await removeTenderAssignment({
      tenderId,
      userId,
    })

    


    if (!removed) {
      return res.status(404).json({
        success: false,
        message:
          'Employee is not assigned to this tender.',
      })
    }

    await createTenderActivity({
        tenderId,
        userId: req.user.id,
        actionType: 'EMPLOYEE_REMOVED',
        entityType: 'ASSIGNMENT',
        entityId: null,
        description: removedEmployee
          ? `${removedEmployee.name} was removed from this tender.`
          : 'Employee removed from tender.',
        metadata: {
          removedUserId: userId,
          removedUserName:
            removedEmployee?.name || null,
        },
      })

    const assignments =
      await getTenderAssignments(tenderId)

    return res.status(200).json({
      success: true,
      message:
        'Employee removed from tender successfully.',
      data: {
        tenderId,
        removedUserId: userId,
        assignments,
      },
    })
  } catch (error) {
    next(error)
  }
}

/* =========================================================
   LIST ASSIGNABLE EMPLOYEES
========================================================= */

export const listAssignableEmployees = async (
  req,
  res
) => {
  try {
    const employees =
      await getActiveEmployees()

    return res.status(200).json({
      success: true,
      employees,
    })
  } catch (error) {
    console.error(
      'List assignable employees error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load assignable employees.',
    })
  }
}

export const listInternalOwners = async (req, res) => {
  try {
    const companyId = Number(req.query.companyId)

    if (
      !Number.isInteger(companyId) ||
      companyId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid company ID is required.',
      })
    }

    const company = await findCompanyById(companyId)

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Selected company does not exist.',
      })
    }

    if (company.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message:
          'Internal owners cannot be loaded for an inactive company.',
      })
    }

    const owners =
      await getActiveTenderOwners(companyId)

    return res.status(200).json({
      success: true,
      owners,
    })
  } catch (error) {
    console.error(
      'List internal owners error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to load internal owners.',
    })
  }
}
/* =========================================================
   EMPLOYEE ASSIGNED TENDERS
========================================================= */

export const listMyAssignedTenders = async (
  req,
  res
) => {
  try {
    const tenders =
      await getAssignedTendersByUserId(
        req.user.id
      )

    return res.status(200).json({
      success: true,
      tenders,
    })
  } catch (error) {
    console.error(
      'List assigned tenders error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load assigned tenders.',
    })
  }
}



/* =========================================================
   ARCHIVE TENDER
========================================================= */

export const archiveTender = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(req.params.id)

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

    const archived = await archiveTenderById(
      tenderId
    )



    if (!archived) {
      return res.status(404).json({
        success: false,
        message:
          'Tender was not found or is already archived.',
      })
    }


    // --------------------------------------------------
    // Activity log - tender archived
    // --------------------------------------------------

    await createTenderActivity({
      tenderId,
      userId: req.user.id,
      actionType: 'TENDER_ARCHIVED',
      entityType: 'TENDER',
      entityId: tenderId,
      description: `Tender "${tender.title}" was archived.`,
      metadata: {
        tenderId,
        title: tender.title,
        referenceNo: tender.reference_no,
        companyId: tender.company_id || null,
        companyName: tender.company_name || null,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Tender archived successfully.',
      data: {
        id: tenderId,
        referenceNo: tender.reference_no,
        title: tender.title,
      },
    })
  } catch (error) {
    next(error)
  }
}