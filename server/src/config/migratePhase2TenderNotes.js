import 'dotenv/config'
import pool from './db.js'

const migratePhase2TenderNotes = async () => {
  try {
    console.log(
      'Starting Phase 2F Tender Internal Notes migration...'
    )

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tender_internal_notes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

        tender_id INT UNSIGNED NOT NULL,

        note_type ENUM(
          'INSTRUCTION',
          'STRATEGY',
          'OBSERVATION',
          'QUESTION',
          'RISK',
          'OUTSTANDING_ISSUE',
          'GENERAL_NOTE'
        ) NOT NULL DEFAULT 'GENERAL_NOTE',

        

        content TEXT NOT NULL,

        created_by INT UNSIGNED NOT NULL,

        is_active TINYINT(1) NOT NULL DEFAULT 1,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_tender_internal_notes_tender
          FOREIGN KEY (tender_id)
          REFERENCES tenders(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,

        CONSTRAINT fk_tender_internal_notes_created_by
          FOREIGN KEY (created_by)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT,

        INDEX idx_tender_internal_notes_tender_id (
          tender_id
        ),

        INDEX idx_tender_internal_notes_created_by (
          created_by
        ),

        INDEX idx_tender_internal_notes_note_type (
          note_type
        ),

        INDEX idx_tender_internal_notes_is_active (
          is_active
        )
      )
    `)

    console.log(
      'tender_internal_notes table created/verified.'
    )

    console.log(
      'Phase 2F Tender Internal Notes migration completed successfully.'
    )

    process.exit(0)
  } catch (error) {
    console.error(
      'Phase 2F Tender Internal Notes migration failed:',
      error
    )

    process.exit(1)
  }
}

migratePhase2TenderNotes()