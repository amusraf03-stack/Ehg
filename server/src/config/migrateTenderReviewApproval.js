import 'dotenv/config'
import pool, {
  testDatabaseConnection,
} from './db.js'

const migrateTenderReviewApproval = async () => {
  let connection

  try {
    await testDatabaseConnection()

    connection = await pool.getConnection()

    console.log(
      'Starting Tender Review & Approval migration...'
    )

    await connection.beginTransaction()

    // --------------------------------------------------
    // REQUIREMENTS
    // --------------------------------------------------

    const [requirementColumns] =
      await connection.query(`
        SHOW COLUMNS
        FROM tender_requirements
        LIKE 'review_status'
      `)

    if (requirementColumns.length === 0) {
      await connection.query(`
        ALTER TABLE tender_requirements

        ADD COLUMN review_status ENUM(
          'NOT_SUBMITTED',
          'AWAITING_REVIEW',
          'APPROVED',
          'CHANGES_REQUESTED'
        )
        NOT NULL
        DEFAULT 'NOT_SUBMITTED'
        AFTER status,

        ADD COLUMN reviewed_by
          INT UNSIGNED NULL
          AFTER review_status,

        ADD COLUMN reviewed_at
          DATETIME NULL
          AFTER reviewed_by,

        ADD COLUMN review_comment
          TEXT NULL
          AFTER reviewed_at,

        ADD INDEX idx_tender_requirements_review_status (
          review_status
        ),

        ADD CONSTRAINT fk_tender_requirements_reviewed_by
          FOREIGN KEY (reviewed_by)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      `)
    }

    // --------------------------------------------------
    // COMPLIANCE
    // --------------------------------------------------

    const [complianceColumns] =
      await connection.query(`
        SHOW COLUMNS
        FROM tender_compliance_items
        LIKE 'review_status'
      `)

    if (complianceColumns.length === 0) {
      await connection.query(`
        ALTER TABLE tender_compliance_items

        ADD COLUMN review_status ENUM(
          'NOT_SUBMITTED',
          'AWAITING_REVIEW',
          'APPROVED',
          'CHANGES_REQUESTED'
        )
        NOT NULL
        DEFAULT 'NOT_SUBMITTED'
        AFTER status,

        ADD COLUMN reviewed_by
          INT UNSIGNED NULL
          AFTER review_status,

        ADD COLUMN reviewed_at
          DATETIME NULL
          AFTER reviewed_by,

        ADD COLUMN review_comment
          TEXT NULL
          AFTER reviewed_at,

        ADD INDEX idx_tender_compliance_review_status (
          review_status
        ),

        ADD CONSTRAINT fk_tender_compliance_reviewed_by
          FOREIGN KEY (reviewed_by)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      `)
    }

    // Existing completed work should enter review.
    await connection.query(`
      UPDATE tender_requirements
      SET review_status = 'AWAITING_REVIEW'
      WHERE status = 'COMPLETED'
        AND review_status = 'NOT_SUBMITTED'
        AND is_active = 1
    `)

    await connection.query(`
      UPDATE tender_compliance_items
      SET review_status = 'AWAITING_REVIEW'
      WHERE status = 'COMPLETED'
        AND review_status = 'NOT_SUBMITTED'
        AND is_active = 1
    `)

    await connection.commit()

    console.log(
      'Tender Review & Approval migration completed successfully.'
    )
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }

    console.error(
      'Tender Review & Approval migration failed:',
      error.message
    )

    throw error
  } finally {
    if (connection) {
      connection.release()
    }

    await pool.end()
  }
}

migrateTenderReviewApproval()
  .then(() => {
    console.log('Review migration finished.')
  })
  .catch(() => {
    process.exitCode = 1
  })