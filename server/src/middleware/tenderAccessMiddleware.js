import {
  getTenderById,
} from '../models/tenderModel.js'

export const requireTenderAccess = async (
  req,
  res,
  next
) => {
  try {
    const tenderId = Number(
      req.params.tenderId || req.params.id
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

    const tender = await getTenderById(tenderId)

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found.',
      })
    }

    // All tender workspace roles can access all tenders.
    // Individual routes/controllers still control
    // what each role can modify.
    if (
      ['ADMIN', 'CEO', 'MANAGER', 'EMPLOYEE'].includes(
        req.user.role
      )
    ) {
      req.tender = tender
      return next()
    }

    return res.status(403).json({
      success: false,
      message:
        'You do not have permission to access this tender.',
    })
  } catch (error) {
    next(error)
  }
}