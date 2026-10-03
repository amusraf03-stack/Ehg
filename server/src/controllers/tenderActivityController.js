import {
  getTenderActivities,
} from '../models/tenderActivityModel.js'

export const listTenderActivities = async (
  req,
  res
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

    const activities =
      await getTenderActivities(tenderId)

    return res.status(200).json({
      success: true,
      activities,
    })
  } catch (error) {
    console.error(
      'List tender activities error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to load tender activity history.',
    })
  }
}