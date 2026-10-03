import pool from '../config/db.js'

export const getDefaultComplianceTemplate = async () => {
  const [rows] = await pool.query(`
    SELECT
      id,
      name,
      description,
      status,
      is_default,
      created_by,
      created_at,
      updated_at
    FROM compliance_templates
    WHERE status = 'ACTIVE'
      AND is_default = 1
    ORDER BY id
    LIMIT 1
  `)

  return rows[0] || null
}

export const getComplianceTemplateItems = async (
  templateId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        template_id,
        category,
        title,
        description,
        is_mandatory,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM compliance_template_items
      WHERE template_id = ?
        AND is_active = 1
      ORDER BY sort_order ASC, id ASC
    `,
    [templateId]
  )

  return rows
}

export const getComplianceTemplateItemsForTender =
  async (templateId, tenderId) => {
    const [rows] = await pool.query(
      `
        SELECT
          cti.id,
          cti.template_id,
          cti.category,
          cti.title,
          cti.description,
          cti.is_mandatory,
          cti.sort_order,

          tci.id AS tender_compliance_item_id,
          tci.is_active AS tender_item_is_active,

          CASE
            WHEN tci.id IS NULL
              THEN 'AVAILABLE'

            WHEN tci.is_active = 1
              THEN 'ACTIVE'

            ELSE 'ARCHIVED'
          END AS tender_state

        FROM compliance_template_items cti

        LEFT JOIN tender_compliance_items tci
          ON tci.tender_id = ?
          AND tci.source_template_item_id = cti.id

        WHERE cti.template_id = ?
          AND cti.is_active = 1

        ORDER BY
          cti.sort_order ASC,
          cti.id ASC
      `,
      [tenderId, templateId]
    )

    return rows
  }


export const getTenderComplianceItems = async (
  tenderId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        tci.id,
        tci.tender_id,
        tci.source_template_item_id,
        tci.category,
        tci.title,
        tci.description,
        tci.is_mandatory,
        tci.status,
        tci.review_status,
tci.reviewed_by,
reviewer.name AS reviewed_by_name,
tci.reviewed_at,
tci.review_comment,
        tci.assigned_user_id,
        assigned_user.name
          AS assigned_user_name,
        assigned_user.email
          AS assigned_user_email,
        tci.due_date,
        tci.notes,
        tci.sort_order,
        tci.is_active,
        tci.created_by,
        creator.name
          AS created_by_name,
        tci.completed_by,
        completer.name
          AS completed_by_name,
        tci.completed_at,
        tci.created_at,
        tci.updated_at
      FROM tender_compliance_items tci

      LEFT JOIN users assigned_user
        ON assigned_user.id =
          tci.assigned_user_id

      LEFT JOIN users creator
        ON creator.id =
          tci.created_by

     LEFT JOIN users completer
  ON completer.id =
    tci.completed_by

LEFT JOIN users reviewer
  ON reviewer.id =
    tci.reviewed_by

WHERE tci.tender_id = ?
  AND tci.is_active = 1

      ORDER BY
        tci.sort_order ASC,
        tci.id ASC
    `,
    [tenderId]
  )

  return rows
}

export const getTenderComplianceItemById = async (
  tenderId,
  complianceItemId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        tci.id,
        tci.tender_id,
        tci.source_template_item_id,
        tci.category,
        tci.title,
        tci.description,
        tci.is_mandatory,
        tci.status,
        tci.review_status,
tci.reviewed_by,
reviewer.name AS reviewed_by_name,
tci.reviewed_at,
tci.review_comment,
        tci.assigned_user_id,
        assigned_user.name
          AS assigned_user_name,
        tci.due_date,
        tci.notes,
        tci.sort_order,
        tci.is_active,
        tci.created_by,
        creator.name
          AS created_by_name,
        tci.completed_by,
        completer.name
          AS completed_by_name,
        tci.completed_at,
        tci.created_at,
        tci.updated_at
      FROM tender_compliance_items tci

      LEFT JOIN users assigned_user
        ON assigned_user.id =
          tci.assigned_user_id

      LEFT JOIN users creator
        ON creator.id =
          tci.created_by

      LEFT JOIN users completer
        ON completer.id =
          tci.completed_by

      LEFT JOIN users reviewer
        ON reviewer.id = tci.reviewed_by

      WHERE tci.tender_id = ?
        AND tci.id = ?
        AND tci.is_active = 1

      LIMIT 1
    `,
    [tenderId, complianceItemId]
  )

  return rows[0] || null
}

export const getTenderComplianceSummary = async (
  tenderId
) => {
  const [rows] = await pool.query(
    `
      SELECT
        COUNT(*) AS total,

        SUM(
          CASE
            WHEN status = 'NOT_STARTED'
            THEN 1
            ELSE 0
          END
        ) AS notStarted,

        SUM(
          CASE
            WHEN status = 'IN_PROGRESS'
            THEN 1
            ELSE 0
          END
        ) AS inProgress,

        SUM(
          CASE
            WHEN status = 'COMPLETED'
            THEN 1
            ELSE 0
          END
        ) AS completed,

        SUM(
          CASE
            WHEN status = 'NOT_APPLICABLE'
            THEN 1
            ELSE 0
          END
        ) AS notApplicable,

        SUM(
          CASE
            WHEN is_mandatory = 1
            THEN 1
            ELSE 0
          END
        ) AS mandatory,

        SUM(
          CASE
            WHEN due_date < CURDATE()
              AND status NOT IN (
                'COMPLETED',
                'NOT_APPLICABLE'
              )
            THEN 1
            ELSE 0
          END
        ) AS overdue

      FROM tender_compliance_items
      WHERE tender_id = ?
        AND is_active = 1
    `,
    [tenderId]
  )

  const summary = rows[0] || {}

  return {
    total: Number(summary.total || 0),
    notStarted: Number(
      summary.notStarted || 0
    ),
    inProgress: Number(
      summary.inProgress || 0
    ),
    completed: Number(
      summary.completed || 0
    ),
    notApplicable: Number(
      summary.notApplicable || 0
    ),
    mandatory: Number(
      summary.mandatory || 0
    ),
    overdue: Number(
      summary.overdue || 0
    ),
  }
}

export const applyComplianceTemplateToTender =
  async ({
    tenderId,
    templateId,
    createdBy,
    templateItemIds,
  }) => {
    const connection =
      await pool.getConnection()

    try {
      await connection.beginTransaction()

      let createdCount = 0
      let restoredCount = 0
      let skippedCount = 0

      for (const templateItemId of templateItemIds) {
        // Make sure this item really belongs
        // to the selected active template.
        const [templateRows] =
          await connection.query(
            `
              SELECT
                id,
                category,
                title,
                description,
                is_mandatory,
                sort_order
              FROM compliance_template_items
              WHERE id = ?
                AND template_id = ?
                AND is_active = 1
              LIMIT 1
            `,
            [
              templateItemId,
              templateId,
            ]
          )

        const templateItem =
          templateRows[0]

        if (!templateItem) {
          continue
        }

        // Check whether this template item has
        // already existed for this tender.
        const [existingRows] =
          await connection.query(
            `
              SELECT
                id,
                is_active
              FROM tender_compliance_items
              WHERE tender_id = ?
                AND source_template_item_id = ?
              ORDER BY id DESC
              LIMIT 1
            `,
            [
              tenderId,
              templateItemId,
            ]
          )

        const existing =
          existingRows[0]

        // Already active = do nothing.
        if (
          existing &&
          Number(existing.is_active) === 1
        ) {
          skippedCount += 1
          continue
        }

        // Previously archived = restore it.
        if (existing) {
          await connection.query(
            `
              UPDATE tender_compliance_items
              SET
                category = ?,
                title = ?,
                description = ?,
                is_mandatory = ?,
                status = 'NOT_STARTED',
                assigned_user_id = NULL,
                due_date = NULL,
                notes = NULL,
                sort_order = ?,
                is_active = 1,
                completed_by = NULL,
                completed_at = NULL
              WHERE id = ?
                AND tender_id = ?
                AND is_active = 0
            `,
            [
              templateItem.category,
              templateItem.title,
              templateItem.description,
              templateItem.is_mandatory,
              templateItem.sort_order,
              existing.id,
              tenderId,
            ]
          )

          restoredCount += 1
          continue
        }

        // Never existed before = create it.
        await connection.query(
          `
            INSERT INTO tender_compliance_items (
              tender_id,
              source_template_item_id,
              category,
              title,
              description,
              is_mandatory,
              status,
              assigned_user_id,
              due_date,
              notes,
              sort_order,
              is_active,
              created_by
            )
            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              'NOT_STARTED',
              NULL,
              NULL,
              NULL,
              ?,
              1,
              ?
            )
          `,
          [
            tenderId,
            templateItem.id,
            templateItem.category,
            templateItem.title,
            templateItem.description,
            templateItem.is_mandatory,
            templateItem.sort_order,
            createdBy,
          ]
        )

        createdCount += 1
      }

      await connection.commit()

      return {
        createdCount,
        restoredCount,
        skippedCount,
        appliedCount:
          createdCount + restoredCount,
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  

export const restoreTenderComplianceItem =
  async ({
    tenderId,
    templateItemId,
  }) => {
    const [result] = await pool.query(
      `
        UPDATE tender_compliance_items
        SET
          is_active = 1,
          status = 'NOT_STARTED',
          assigned_user_id = NULL,
          due_date = NULL,
          notes = NULL,
          completed_by = NULL,
          completed_at = NULL
        WHERE tender_id = ?
          AND source_template_item_id = ?
          AND is_active = 0
      `,
      [
        tenderId,
        templateItemId,
      ]
    )

    return result.affectedRows > 0
  }

export const createTenderComplianceItem = async ({
  tenderId,
  category,
  title,
  description,
  isMandatory,
  status,
  assignedUserId,
  dueDate,
  notes,
  sortOrder,
  createdBy,
}) => {
  const [result] = await pool.query(
    `
      INSERT INTO tender_compliance_items (
        tender_id,
        source_template_item_id,
        category,
        title,
        description,
        is_mandatory,
        status,
        assigned_user_id,
        due_date,
        notes,
        sort_order,
        is_active,
        created_by
      )
      VALUES (
        ?,
        NULL,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        1,
        ?
      )
    `,
    [
      tenderId,
      category,
      title,
      description,
      isMandatory ? 1 : 0,
      status,
      assignedUserId,
      dueDate,
      notes,
      sortOrder,
      createdBy,
    ]
  )

  return getTenderComplianceItemById(
    tenderId,
    result.insertId
  )
}

export const updateTenderComplianceItemById =
  async ({
    tenderId,
    complianceItemId,
    category,
    title,
    description,
    isMandatory,
    status,
    assignedUserId,
    dueDate,
    notes,
    sortOrder,
    completedBy,
    completedAt,
  }) => {
    await pool.query(
      `
        UPDATE tender_compliance_items
        SET
          category = ?,
          title = ?,
          description = ?,
          is_mandatory = ?,
          status = ?,
          assigned_user_id = ?,
          due_date = ?,
          notes = ?,
          sort_order = ?,
          completed_by = ?,
          completed_at = ?
        WHERE id = ?
          AND tender_id = ?
          AND is_active = 1
      `,
      [
        category,
        title,
        description,
        isMandatory ? 1 : 0,
        status,
        assignedUserId,
        dueDate,
        notes,
        sortOrder,
        completedBy,
        completedAt,
        complianceItemId,
        tenderId,
      ]
    )

    return getTenderComplianceItemById(
      tenderId,
      complianceItemId
    )
  }

export const deactivateTenderComplianceItem =
  async (
    tenderId,
    complianceItemId
  ) => {
    const [result] = await pool.query(
      `
        UPDATE tender_compliance_items
        SET is_active = 0
        WHERE id = ?
          AND tender_id = ?
          AND is_active = 1
      `,
      [complianceItemId, tenderId]
    )

    return result.affectedRows > 0
  }


  export const updateTenderComplianceReview = async ({
  tenderId,
  complianceItemId,
  reviewStatus,
  reviewedBy = null,
  reviewedAt = null,
  reviewComment = null,
}) => {
  const [result] = await pool.query(
    `
    UPDATE tender_compliance_items
    SET
      review_status = ?,
      reviewed_by = ?,
      reviewed_at = ?,
      review_comment = ?
    WHERE id = ?
      AND tender_id = ?
      AND is_active = 1
    `,
    [
      reviewStatus,
      reviewedBy,
      reviewedAt,
      reviewComment,
      complianceItemId,
      tenderId,
    ]
  )

  return result.affectedRows
}