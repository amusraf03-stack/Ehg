import {
  applyComplianceTemplateToTender,
  createTenderComplianceItem,
  deactivateTenderComplianceItem,
  getDefaultComplianceTemplate,
  getComplianceTemplateItemsForTender,
  getTenderComplianceItemById,
  getTenderComplianceItems,
  getTenderComplianceSummary,
  updateTenderComplianceItemById,
  updateTenderComplianceReview,
} from '../models/tenderComplianceModel.js'

  import {
    getTenderById,
  } from '../models/tenderModel.js'

  import pool from '../config/db.js'

  import {
    findUserById,
  } from '../models/userModel.js'

  import {
    isUserAssignedToTender,
  } from '../models/tenderRequirementModel.js'


  import {
    createTenderActivity,
  } from '../models/tenderActivityModel.js'

  const ALLOWED_STATUSES = [
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'NOT_APPLICABLE',
  ]

  const parsePositiveId = (value) => {
    const parsed = Number(value)

    if (
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      return null
    }

    return parsed
  }

  const normalizeBoolean = (
    value,
    defaultValue = true
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return defaultValue
    }

    if (typeof value === 'boolean') {
      return value
    }

    if (value === 1 || value === '1') {
      return true
    }

    if (value === 0 || value === '0') {
      return false
    }

    if (
      typeof value === 'string' &&
      value.toLowerCase() === 'true'
    ) {
      return true
    }

    if (
      typeof value === 'string' &&
      value.toLowerCase() === 'false'
    ) {
      return false
    }

    return defaultValue
  }

  const validateAssignedEmployee = async ({
    tenderId,
    assignedUserId,
  }) => {
    if (
      assignedUserId === undefined ||
      assignedUserId === null ||
      assignedUserId === ''
    ) {
      return {
        userId: null,
      }
    }

    const userId =
      parsePositiveId(assignedUserId)

    if (!userId) {
      return {
        error:
          'Assigned employee ID is invalid.',
      }
    }

    const user =
      await findUserById(userId)

    if (!user) {
      return {
        error:
          'Assigned employee was not found.',
      }
    }

    if (user.role !== 'EMPLOYEE') {
      return {
        error:
          'Compliance items can only be assigned to employees.',
      }
    }

    if (user.status !== 'ACTIVE') {
      return {
        error:
          'Assigned employee must be active.',
      }
    }

    const assigned =
      await isUserAssignedToTender(
        tenderId,
        userId
      )

    if (!assigned) {
      return {
        error:
          'Employee must be assigned to the tender before assigning this compliance item.',
      }
    }

    return {
      userId,
    }
  }

  const getTenderOrFail = async (
    tenderId
  ) => {
    const parsedTenderId =
      parsePositiveId(tenderId)

    if (!parsedTenderId) {
      return {
        error: 'Tender ID is invalid.',
      }
    }

    const tender =
      await getTenderById(parsedTenderId)

    if (!tender) {
      return {
        error: 'Tender not found.',
        status: 404,
      }
    }

    return {
      tenderId: parsedTenderId,
      tender,
    }
  }

  export const listTenderCompliance = async (
    req,
    res
  ) => {
    try {
      const tenderResult =
        await getTenderOrFail(
          req.params.tenderId
        )

      if (tenderResult.error) {
        return res
          .status(
            tenderResult.status || 400
          )
          .json({
            success: false,
            message: tenderResult.error,
          })
      }

      const [
        items,
        summary,
      ] = await Promise.all([
        getTenderComplianceItems(
          tenderResult.tenderId
        ),
        getTenderComplianceSummary(
          tenderResult.tenderId
        ),
      ])



      return res.json({
        success: true,
        count: items.length,
        summary,
        data: items,
      })
    } catch (error) {
      console.error(
        'List tender compliance error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Unable to load tender compliance items.',
      })
    }
  }


  export const getComplianceTemplateOptions =
    async (req, res) => {
      try {
        const tenderResult =
          await getTenderOrFail(
            req.params.tenderId
          )

        if (tenderResult.error) {
          return res
            .status(
              tenderResult.status || 400
            )
            .json({
              success: false,
              message:
                tenderResult.error,
            })
        }

        const template =
          await getDefaultComplianceTemplate()

        if (!template) {
          return res.status(404).json({
            success: false,
            message:
              'No active default compliance template is available.',
          })
        }

        const items =
          await getComplianceTemplateItemsForTender(
            template.id,
            tenderResult.tenderId
          )

        return res.status(200).json({
          success: true,
          template: {
            id: template.id,
            name: template.name,
            description:
              template.description,
          },
          count: items.length,
          data: items,
        })
      } catch (error) {
        console.error(
          'Get compliance template options error:',
          error
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to load compliance template options.',
        })
      }
    }



  export const applyDefaultComplianceTemplate =
    async (req, res) => {
      try {
        const tenderResult =
          await getTenderOrFail(
            req.params.tenderId
          )

        if (tenderResult.error) {
          return res
            .status(
              tenderResult.status || 400
            )
            .json({
              success: false,
              message:
                tenderResult.error,
            })
        }

        const template =
          await getDefaultComplianceTemplate()

        if (!template) {
          return res.status(404).json({
            success: false,
            message:
              'No active default compliance template is available.',
          })
        }

        const {
          templateItemIds,
        } = req.body

        if (
          !Array.isArray(templateItemIds) ||
          templateItemIds.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Select at least one compliance item to apply.',
          })
        }

        const parsedTemplateItemIds = [
          ...new Set(
            templateItemIds
              .map((id) => Number(id))
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )
          ),
        ]

        if (
          parsedTemplateItemIds.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Selected compliance items are invalid.',
          })
        }

        const result =
          await applyComplianceTemplateToTender({
            tenderId:
              tenderResult.tenderId,
            templateId:
              template.id,
            createdBy:
              req.user.id,
            templateItemIds:
              parsedTemplateItemIds,
          })

        const [
          items,
          summary,
        ] = await Promise.all([
          getTenderComplianceItems(
            tenderResult.tenderId
          ),
          getTenderComplianceSummary(
            tenderResult.tenderId
          ),
        ])

        if (result.appliedCount > 0) {
          await createTenderActivity({
            tenderId:
              tenderResult.tenderId,
            userId:
              req.user.id,
            actionType:
              'COMPLIANCE_TEMPLATE_APPLIED',
            entityType:
              'COMPLIANCE_TEMPLATE',
            entityId:
              template.id,
            description:
              `Selected compliance items from "${template.name}" were applied to this tender.`,
            metadata: {
              templateId:
                template.id,
              templateName:
                template.name,
              selectedCount:
                parsedTemplateItemIds.length,
              createdCount:
                result.createdCount,
              restoredCount:
                result.restoredCount,
              skippedCount:
                result.skippedCount,
            },
          })
        }

        return res.json({
          success: true,
          message:
            result.appliedCount > 0
              ? `${result.appliedCount} compliance item(s) applied successfully.`
              : 'Selected compliance items are already active.',
          appliedCount:
            result.appliedCount,
          createdCount:
            result.createdCount,
          restoredCount:
            result.restoredCount,
          skippedCount:
            result.skippedCount,
          template: {
            id: template.id,
            name: template.name,
          },
          summary,
          data: items,
        })
      } catch (error) {
        console.error(
          'Apply compliance template error:',
          error
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to apply compliance template.',
        })
      }
    }

  export const createComplianceItem =
    async (req, res) => {
      try {
        const tenderResult =
          await getTenderOrFail(
            req.params.tenderId
          )

        if (tenderResult.error) {
          return res
            .status(
              tenderResult.status || 400
            )
            .json({
              success: false,
              message:
                tenderResult.error,
            })
        }

        const {
          category = 'GENERAL',
          title,
          description = null,
          isMandatory = true,
          status = 'NOT_STARTED',
          assignedUserId = null,
          dueDate = null,
          notes = null,
          sortOrder = 0,
        } = req.body

        if (
          !title ||
          !String(title).trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Compliance item title is required.',
          })
        }

        if (
          !ALLOWED_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid compliance status.',
          })
        }

        const parsedSortOrder =
          Number(sortOrder)

        if (
          !Number.isInteger(
            parsedSortOrder
          ) ||
          parsedSortOrder < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Sort order must be a non-negative integer.',
          })
        }

        const assignment =
          await validateAssignedEmployee({
            tenderId:
              tenderResult.tenderId,
            assignedUserId,
          })

        if (assignment.error) {
          return res.status(400).json({
            success: false,
            message: assignment.error,
          })
        }

        const completed =
          status === 'COMPLETED'

        const item =
          await createTenderComplianceItem(
            {
              tenderId:
                tenderResult.tenderId,
              category:
                String(category).trim() ||
                'GENERAL',
              title: String(title).trim(),
              description:
                description
                  ? String(
                      description
                    ).trim()
                  : null,
              isMandatory:
                normalizeBoolean(
                  isMandatory,
                  true
                ),
              status,
              assignedUserId:
                assignment.userId,
              dueDate:
                dueDate || null,
              notes:
                notes
                  ? String(notes).trim()
                  : null,
              sortOrder:
                parsedSortOrder,
              createdBy:
                req.user.id,
            }
          )

        /*
        * createTenderComplianceItem does
        * not yet set completion audit
        * fields on insert, so if a new
        * item is created directly as
        * COMPLETED we update it once.
        */
        let finalItem = item

        if (completed) {
          finalItem =
            await updateTenderComplianceItemById(
              {
                tenderId:
                  tenderResult.tenderId,
                complianceItemId:
                  item.id,
                category:
                  item.category,
                title: item.title,
                description:
                  item.description,
                isMandatory:
                  Number(
                    item.is_mandatory
                  ) === 1,
                status:
                  'COMPLETED',
                assignedUserId:
                  item.assigned_user_id,
                dueDate:
                  item.due_date,
                notes:
                  item.notes,
                sortOrder:
                  item.sort_order,
                completedBy:
                  req.user.id,
                completedAt:
                  new Date(),
              }
            )
        }


        await createTenderActivity({
    tenderId: tenderResult.tenderId,
    userId: req.user.id,
    actionType: 'COMPLIANCE_ITEM_CREATED',
    entityType: 'COMPLIANCE_ITEM',
    entityId: finalItem.id,
    description: `Compliance item "${finalItem.title}" was created.`,
    metadata: {
      title: finalItem.title,
      category: finalItem.category,
      status: finalItem.status,
      isMandatory:
        Number(finalItem.is_mandatory) === 1,
      assignedUserId:
        finalItem.assigned_user_id || null,
      assignedUserName:
        finalItem.assigned_user_name || null,
      dueDate:
        finalItem.due_date || null,
    },
  })

        const summary =
          await getTenderComplianceSummary(
            tenderResult.tenderId
          )

        return res.status(201).json({
          success: true,
          message:
            'Compliance item created successfully.',
          summary,
          data: finalItem,
        })
      } catch (error) {
        console.error(
          'Create compliance item error:',
          error
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to create compliance item.',
        })
      }
    }

  export const updateComplianceItem =
    async (req, res) => {
      try {
        const tenderResult =
          await getTenderOrFail(
            req.params.tenderId
          )

        if (tenderResult.error) {
          return res
            .status(
              tenderResult.status || 400
            )
            .json({
              success: false,
              message:
                tenderResult.error,
            })
        }

        const complianceItemId =
          parsePositiveId(
            req.params.complianceItemId
          )

        if (!complianceItemId) {
          return res.status(400).json({
            success: false,
            message:
              'Compliance item ID is invalid.',
          })
        }

        const existing =
          await getTenderComplianceItemById(
            tenderResult.tenderId,
            complianceItemId
          )

        if (!existing) {
          return res.status(404).json({
            success: false,
            message:
              'Compliance item not found.',
          })
        }

        const {
          category = existing.category,
          title = existing.title,
          description =
            existing.description,
          isMandatory =
            Number(
              existing.is_mandatory
            ) === 1,
          status = existing.status,
          assignedUserId =
            existing.assigned_user_id,
          dueDate = existing.due_date,
          notes = existing.notes,
          sortOrder =
            existing.sort_order,
        } = req.body

        if (
          !title ||
          !String(title).trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Compliance item title is required.',
          })
        }

        if (
          !ALLOWED_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid compliance status.',
          })
        }

        const parsedSortOrder =
          Number(sortOrder)

        if (
          !Number.isInteger(
            parsedSortOrder
          ) ||
          parsedSortOrder < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Sort order must be a non-negative integer.',
          })
        }

        const assignment =
          await validateAssignedEmployee({
            tenderId:
              tenderResult.tenderId,
            assignedUserId,
          })

        if (assignment.error) {
          return res.status(400).json({
            success: false,
            message:
              assignment.error,
          })
        }

        let completedBy =
          existing.completed_by

        let completedAt =
          existing.completed_at

        if (
          status === 'COMPLETED' &&
          existing.status !== 'COMPLETED'
        ) {
          completedBy = req.user.id
          completedAt = new Date()
        }

        if (status !== 'COMPLETED') {
          completedBy = null
          completedAt = null
        }

        const updated =
          await updateTenderComplianceItemById(
            {
              tenderId:
                tenderResult.tenderId,
              complianceItemId,
              category:
                String(category).trim() ||
                'GENERAL',
              title:
                String(title).trim(),
              description:
                description
                  ? String(
                      description
                    ).trim()
                  : null,
              isMandatory:
                normalizeBoolean(
                  isMandatory,
                  true
                ),
              status,
              assignedUserId:
                assignment.userId,
              dueDate:
                dueDate || null,
              notes:
                notes
                  ? String(notes).trim()
                  : null,
              sortOrder:
                parsedSortOrder,
              completedBy,
              completedAt,
            }
          )


        const complianceChanges = {
    previousTitle: existing.title,
    newTitle: updated.title,

    previousCategory: existing.category,
    newCategory: updated.category,

    descriptionChanged:
      (existing.description || '') !==
      (updated.description || ''),

    previousMandatory:
      Number(existing.is_mandatory) === 1,
    newMandatory:
      Number(updated.is_mandatory) === 1,

    previousStatus: existing.status,
    newStatus: updated.status,

    previousAssignedUserId:
      existing.assigned_user_id || null,
    previousAssignedUserName:
      existing.assigned_user_name || null,

    newAssignedUserId:
      updated.assigned_user_id || null,
    newAssignedUserName:
      updated.assigned_user_name || null,

    previousDueDate:
      existing.due_date || null,
    newDueDate:
      updated.due_date || null,

    notesChanged:
      (existing.notes || '') !==
      (updated.notes || ''),

    previousSortOrder:
      Number(existing.sort_order ?? 0),
    newSortOrder:
      Number(updated.sort_order ?? 0),
  }

  await createTenderActivity({
    tenderId: tenderResult.tenderId,
    userId: req.user.id,
    actionType: 'COMPLIANCE_ITEM_UPDATED',
    entityType: 'COMPLIANCE_ITEM',
    entityId: complianceItemId,
    description:
      `Compliance item "${updated.title}" was updated.`,
    metadata: {
      complianceItemId,
      ...complianceChanges,
    },
  })
        const summary =
          await getTenderComplianceSummary(
            tenderResult.tenderId
          )

        return res.json({
          success: true,
          message:
            'Compliance item updated successfully.',
          summary,
          data: updated,
        })
      } catch (error) {
        console.error(
          'Update compliance item error:',
          error
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to update compliance item.',
        })
      }
    }


    export const updateEmployeeComplianceProgress =
    async (req, res) => {
      try {
        const tenderResult =
          await getTenderOrFail(
            req.params.tenderId
          )

        if (tenderResult.error) {
          return res
            .status(
              tenderResult.status || 400
            )
            .json({
              success: false,
              message:
                tenderResult.error,
            })
        }

        const complianceItemId =
          parsePositiveId(
            req.params.complianceItemId
          )

        if (!complianceItemId) {
          return res.status(400).json({
            success: false,
            message:
              'Compliance item ID is invalid.',
          })
        }

        const existing =
          await getTenderComplianceItemById(
            tenderResult.tenderId,
            complianceItemId
          )

        if (!existing) {
          return res.status(404).json({
            success: false,
            message:
              'Compliance item not found.',
          })
        }

        // Employee can update only a compliance
        // item specifically assigned to them.
       

        const { status } = req.body

        const employeeAllowedStatuses = [
          'NOT_STARTED',
          'IN_PROGRESS',
          'COMPLETED',
        ]

        if (
          !employeeAllowedStatuses.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Employees can only set Not Started, In Progress, or Completed.',
          })
        }

        let completedBy =
          existing.completed_by

        let completedAt =
          existing.completed_at

        if (
          status === 'COMPLETED' &&
          existing.status !== 'COMPLETED'
        ) {
          completedBy = req.user.id
          completedAt = new Date()
        }

        if (
          status !== 'COMPLETED' &&
          existing.status === 'COMPLETED'
        ) {
          completedBy = null
          completedAt = null
        }

        let updated =
          await updateTenderComplianceItemById(
            {
              tenderId:
                tenderResult.tenderId,
              complianceItemId,
              category:
                existing.category,
              title:
                existing.title,
              description:
                existing.description,
              isMandatory:
                Number(
                  existing.is_mandatory
                ) === 1,
              status,
              assignedUserId:
                existing.assigned_user_id,
              dueDate:
                existing.due_date || null,
              notes:
                existing.notes,
              sortOrder:
                existing.sort_order,
              completedBy,
              completedAt,
            }
          )

         // =========================================================
// AUTOMATIC REVIEW STATUS TRANSITION
// =========================================================

if (
  status === 'COMPLETED' &&
  existing.status !== 'COMPLETED'
) {
  await updateTenderComplianceReview({
    tenderId: tenderResult.tenderId,
    complianceItemId,
    reviewStatus: 'AWAITING_REVIEW',
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
  })
} else if (
  status !== 'COMPLETED' &&
  existing.review_status !== 'CHANGES_REQUESTED' &&
  (
    existing.status === 'COMPLETED' ||
    existing.review_status !== 'NOT_SUBMITTED'
  )
) {
  await updateTenderComplianceReview({
    tenderId: tenderResult.tenderId,
    complianceItemId,
    reviewStatus: 'NOT_SUBMITTED',
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
  })
}

updated =
  await getTenderComplianceItemById(
    tenderResult.tenderId,
    complianceItemId
  )


          await createTenderActivity({
            tenderId: tenderResult.tenderId,
            userId: req.user.id,
            actionType: 'COMPLIANCE_PROGRESS_UPDATED',
            entityType: 'COMPLIANCE_ITEM',
            entityId: complianceItemId,
            description:
              `Compliance item "${updated.title}" status changed from ` +
              `${existing.status} to ${updated.status}.`,
            metadata: {
              complianceItemId,
              title: updated.title,
              previousStatus: existing.status,
              newStatus: updated.status,
            },
          })

        const summary =
          await getTenderComplianceSummary(
            tenderResult.tenderId
          )

        return res.status(200).json({
          success: true,
          message:
            'Compliance progress updated successfully.',
          summary,
          data: updated,
        })
      } catch (error) {
        console.error(
          'Employee compliance progress update error:',
          error
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to update compliance progress.',
        })
      }
    }


  export const removeComplianceItem =
    async (req, res) => {
      try {
        const tenderResult =
          await getTenderOrFail(
            req.params.tenderId
          )

        if (tenderResult.error) {
          return res
            .status(
              tenderResult.status || 400
            )
            .json({
              success: false,
              message:
                tenderResult.error,
            })
        }

        const complianceItemId =
          parsePositiveId(
            req.params.complianceItemId
          )

        if (!complianceItemId) {
          return res.status(400).json({
            success: false,
            message:
              'Compliance item ID is invalid.',
          })
        }

        const existing =
          await getTenderComplianceItemById(
            tenderResult.tenderId,
            complianceItemId
          )

        if (!existing) {
          return res.status(404).json({
            success: false,
            message:
              'Compliance item not found.',
          })
        }

        const removed =
          await deactivateTenderComplianceItem(
            tenderResult.tenderId,
            complianceItemId
          )

        if (!removed) {
          return res.status(404).json({
            success: false,
            message:
              'Compliance item not found.',
          })
        }


        // Archive all active documents linked to this compliance item.
  // Physical files are intentionally retained for audit/history.
  await pool.execute(
    `
      UPDATE tender_documents
      SET is_active = 0
      WHERE tender_id = ?
        AND compliance_item_id = ?
        AND is_active = 1
    `,
    [
      tenderResult.tenderId,
      complianceItemId,
    ]
  )


  await createTenderActivity({
  tenderId: tenderResult.tenderId,
  userId: req.user.id,
  actionType: 'COMPLIANCE_ITEM_ARCHIVED',
  entityType: 'COMPLIANCE_ITEM',
  entityId: complianceItemId,
  description:
    `Compliance item "${existing.title}" was archived.`,
  metadata: {
    complianceItemId,
    title: existing.title,
    category: existing.category,
    status: existing.status,
    isMandatory:
      Number(existing.is_mandatory) === 1,
    assignedUserId:
      existing.assigned_user_id || null,
    assignedUserName:
      existing.assigned_user_name || null,
    dueDate:
      existing.due_date || null,
  },
})

        const summary =
          await getTenderComplianceSummary(
            tenderResult.tenderId
          )

        return res.json({
          success: true,
          message:
            'Compliance item removed successfully.',
          summary,
        })
      } catch (error) {
        console.error(
          'Remove compliance item error:',
          error
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to remove compliance item.',
        })
      }
    }