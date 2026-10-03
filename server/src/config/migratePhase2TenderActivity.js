
import 'dotenv/config'
import pool from './db.js'

const migratePhase2TenderActivity = async () => {
  try {
    console.log(
      'Starting Phase 2G Tender Activity migration...'
    )

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tender_activity_logs (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,

        tender_id INT UNSIGNED NOT NULL,

        user_id INT UNSIGNED NULL,

        action_type VARCHAR(100) NOT NULL,

        entity_type VARCHAR(100) NULL,

        entity_id INT UNSIGNED NULL,

        description TEXT NOT NULL,

        metadata JSON NULL,

        created_at TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (id),

        INDEX idx_tender_activity_tender_id (tender_id),
        INDEX idx_tender_activity_user_id (user_id),
        INDEX idx_tender_activity_action_type (action_type),
        INDEX idx_tender_activity_entity (
          entity_type,
          entity_id
        ),
        INDEX idx_tender_activity_created_at (created_at),

        CONSTRAINT fk_tender_activity_tender
          FOREIGN KEY (tender_id)
          REFERENCES tenders(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,

        CONSTRAINT fk_tender_activity_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      )
    `)

    console.log(
      'tender_activity_logs table created/verified.'
    )

    console.log(
      'Phase 2G Tender Activity migration completed successfully.'
    )

    process.exit(0)
  } catch (error) {
    console.error(
      'Phase 2G Tender Activity migration failed:',
      error
    )

    process.exit(1)
  }
}

migratePhase2TenderActivity()