import 'dotenv/config'
import pool, {
  testDatabaseConnection,
} from './db.js'

const migrateTenderFinalSubmission = async () => {
  try {
    console.log(
      'Starting Final Submission migration...'
    )

    // --------------------------------------------------
    // submitted_by
    // --------------------------------------------------
    const [submittedByColumn] = await pool.query(`
      SHOW COLUMNS FROM tenders
      LIKE 'submitted_by'
    `)

    if (submittedByColumn.length === 0) {
      await pool.query(`
        ALTER TABLE tenders
        ADD COLUMN submitted_by INT NULL
        AFTER submitted_at
      `)

      console.log('Added submitted_by')
    } else {
      console.log('submitted_by already exists')
    }

    // --------------------------------------------------
    // submission_reference
    // --------------------------------------------------
    const [referenceColumn] = await pool.query(`
      SHOW COLUMNS FROM tenders
      LIKE 'submission_reference'
    `)

    if (referenceColumn.length === 0) {
      await pool.query(`
        ALTER TABLE tenders
        ADD COLUMN submission_reference VARCHAR(255) NULL
        AFTER submitted_by
      `)

      console.log('Added submission_reference')
    } else {
      console.log(
        'submission_reference already exists'
      )
    }

    // --------------------------------------------------
    // submission_notes
    // --------------------------------------------------
    const [notesColumn] = await pool.query(`
      SHOW COLUMNS FROM tenders
      LIKE 'submission_notes'
    `)

    if (notesColumn.length === 0) {
      await pool.query(`
        ALTER TABLE tenders
        ADD COLUMN submission_notes TEXT NULL
        AFTER submission_reference
      `)

      console.log('Added submission_notes')
    } else {
      console.log(
        'submission_notes already exists'
      )
    }

    // --------------------------------------------------
    // Foreign key for submitted_by
    // --------------------------------------------------
    const [foreignKeys] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tenders'
        AND COLUMN_NAME = 'submitted_by'
        AND REFERENCED_TABLE_NAME = 'users'
    `)

    if (foreignKeys.length === 0) {
      await pool.query(`
        ALTER TABLE tenders
        ADD CONSTRAINT fk_tenders_submitted_by
        FOREIGN KEY (submitted_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    `)

      console.log(
        'Added submitted_by foreign key'
      )
    } else {
      console.log(
        'submitted_by foreign key already exists'
      )
    }

    console.log(
      'Final Submission migration completed successfully.'
    )

    process.exit(0)
  } catch (error) {
    console.error(
      'Final Submission migration failed:',
      error
    )

    process.exit(1)
  }
}

migrateTenderFinalSubmission()