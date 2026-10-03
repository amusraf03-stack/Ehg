import {
  getTenderReviewRequirements,
  getTenderReviewCompliance,
  getTenderReadiness,
} from '../models/tenderReviewModel.js'

import {
  getTenderRequirementById,
  updateTenderRequirementReview,
} from '../models/tenderRequirementModel.js'

import {
  getTenderComplianceItemById,
  updateTenderComplianceReview,
} from '../models/tenderComplianceModel.js'

import pool from '../config/db.js'

/* =========================================================
   HELPERS
========================================================= */

const parsePositiveInteger = (value) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const ALLOWED_REVIEW_DECISIONS = [
  'APPROVED',
  'CHANGES_REQUESTED',
]

const validateReviewDecision = (
  decision,
  comment
) => {
  if (!ALLOWED_REVIEW_DECISIONS.includes(decision)) {
    return {
      valid: false,
      message:
        'Decision must be APPROVED or CHANGES_REQUESTED.',
    }
  }

  if (
    decision === 'CHANGES_REQUESTED' &&
    (!comment || !String(comment).trim())
  ) {
    return {
      valid: false,
      message:
        'A comment is required when requesting changes.',
    }
  }

  return {
    valid: true,
  }
}

/* =========================================================
   GET REVIEW DASHBOARD

   GET /api/tenders/:tenderId/review
========================================================= */

export const getTenderReviewDashboard = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveInteger(
      req.params.tenderId
    )

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    const [
      readiness,
      requirements,
      compliance,
    ] = await Promise.all([
      getTenderReadiness(tenderId),
      getTenderReviewRequirements(tenderId),
      getTenderReviewCompliance(tenderId),
    ])

    return res.status(200).json({
      success: true,
      readiness,
      requirements,
      compliance,
    })
  } catch (error) {
    console.error(
      'Get tender review dashboard error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load tender review dashboard.',
    })
  }
}

/* =========================================================
   REVIEW REQUIREMENT

   PATCH
   /api/tenders/:tenderId/review/requirements/:requirementId

   Body:
   {
     decision: 'APPROVED'
   }

   OR

   {
     decision: 'CHANGES_REQUESTED',
     comment: 'Please upload the latest certificate.'
   }
========================================================= */

export const reviewTenderRequirement = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveInteger(
      req.params.tenderId
    )

    const requirementId = parsePositiveInteger(
      req.params.requirementId
    )

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    if (!requirementId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.',
      })
    }

    const decision = String(
      req.body?.decision || ''
    )
      .trim()
      .toUpperCase()

    const comment =
      req.body?.comment === undefined ||
      req.body?.comment === null
        ? ''
        : String(req.body.comment).trim()

    const validation = validateReviewDecision(
      decision,
      comment
    )

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
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
        message: 'Requirement not found.',
      })
    }

    /*
      A Requirement should only be reviewed after
      the work itself has been completed.

      NOT_APPLICABLE does not require approval.
    */
    if (requirement.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message:
          'Only completed requirements can be reviewed.',
      })
    }

    /*
      Normal review lifecycle:

      COMPLETED
          ↓
      AWAITING_REVIEW
          ↓
      APPROVED / CHANGES_REQUESTED

      We also allow CHANGES_REQUESTED to be reviewed again
      only after the worker completes it again, because
      Step 5 automatically moves it back to AWAITING_REVIEW.
    */
    if (
      requirement.review_status !==
      'AWAITING_REVIEW'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This requirement is not awaiting review.',
      })
    }

    const reviewedAt = new Date()

   let affectedRows

if (decision === 'CHANGES_REQUESTED') {
  // Send the work back to In Progress.
  // Keep CHANGES_REQUESTED + reviewer comment visible
  // until the worker resubmits it as Completed.
  await pool.query(
    `
    UPDATE tender_requirements
    SET
      status = 'IN_PROGRESS',
      completed_by = NULL,
      completed_at = NULL
    WHERE id = ?
      AND tender_id = ?
      AND is_active = 1
    `,
    [requirementId, tenderId]
  )

  affectedRows =
    await updateTenderRequirementReview(
      tenderId,
      requirementId,
      {
        reviewStatus: 'CHANGES_REQUESTED',
        reviewedBy: req.user.id,
        reviewedAt,
        reviewComment: comment,
      }
    )
} else {
  affectedRows =
    await updateTenderRequirementReview(
      tenderId,
      requirementId,
      {
        reviewStatus: 'APPROVED',
        reviewedBy: req.user.id,
        reviewedAt,
        reviewComment: null,
      }
    )
}

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message:
          'Requirement could not be updated.',
      })
    }

    const updatedRequirement =
      await getTenderRequirementById(
        tenderId,
        requirementId
      )

    const readiness =
      await getTenderReadiness(tenderId)

    return res.status(200).json({
      success: true,
      message:
        decision === 'APPROVED'
          ? 'Requirement approved successfully.'
          : 'Changes requested successfully.',
      requirement: updatedRequirement,
      readiness,
    })
  } catch (error) {
    console.error(
      'Review tender requirement error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to review requirement.',
    })
  }
}

/* =========================================================
   REVIEW COMPLIANCE ITEM

   PATCH
   /api/tenders/:tenderId/review/compliance/:complianceItemId

   Body:
   {
     decision: 'APPROVED'
   }

   OR

   {
     decision: 'CHANGES_REQUESTED',
     comment: 'Please correct this compliance evidence.'
   }
========================================================= */

export const reviewTenderCompliance = async (
  req,
  res
) => {
  try {
    const tenderId = parsePositiveInteger(
      req.params.tenderId
    )

    const complianceItemId =
      parsePositiveInteger(
        req.params.complianceItemId
      )

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID.',
      })
    }

    if (!complianceItemId) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid compliance item ID.',
      })
    }

    const decision = String(
      req.body?.decision || ''
    )
      .trim()
      .toUpperCase()

    const comment =
      req.body?.comment === undefined ||
      req.body?.comment === null
        ? ''
        : String(req.body.comment).trim()

    const validation = validateReviewDecision(
      decision,
      comment
    )

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      })
    }

    const complianceItem =
      await getTenderComplianceItemById(
        tenderId,
        complianceItemId
      )

    if (!complianceItem) {
      return res.status(404).json({
        success: false,
        message:
          'Compliance item not found.',
      })
    }

    if (
      complianceItem.status !== 'COMPLETED'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Only completed compliance items can be reviewed.',
      })
    }

    if (
      complianceItem.review_status !==
      'AWAITING_REVIEW'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This compliance item is not awaiting review.',
      })
    }

    const reviewedAt = new Date()

   let affectedRows

if (decision === 'CHANGES_REQUESTED') {
  await pool.query(
    `
    UPDATE tender_compliance_items
    SET
      status = 'IN_PROGRESS',
      completed_by = NULL,
      completed_at = NULL
    WHERE id = ?
      AND tender_id = ?
      AND is_active = 1
    `,
    [complianceItemId, tenderId]
  )

  affectedRows =
    await updateTenderComplianceReview({
      tenderId,
      complianceItemId,
      reviewStatus: 'CHANGES_REQUESTED',
      reviewedBy: req.user.id,
      reviewedAt,
      reviewComment: comment,
    })
} else {
  affectedRows =
    await updateTenderComplianceReview({
      tenderId,
      complianceItemId,
      reviewStatus: 'APPROVED',
      reviewedBy: req.user.id,
      reviewedAt,
      reviewComment: null,
    })
}

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message:
          'Compliance item could not be updated.',
      })
    }

    const updatedCompliance =
      await getTenderComplianceItemById(
        tenderId,
        complianceItemId
      )

    const readiness =
      await getTenderReadiness(tenderId)

    return res.status(200).json({
      success: true,
      message:
        decision === 'APPROVED'
          ? 'Compliance item approved successfully.'
          : 'Changes requested successfully.',
      compliance: updatedCompliance,
      readiness,
    })
  } catch (error) {
    console.error(
      'Review tender compliance error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to review compliance item.',
    })
  }
}