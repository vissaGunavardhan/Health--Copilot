/**
 * Health Copilot - SQLite Database Connection & Schema Placeholder
 * 
 * Future Responsibilities:
 * - Initialize local SQLite database file (e.g. backend/db/health_copilot.db).
 * - Create tables for storing report metadata, raw extracted text, and AI summaries.
 * - Provide CRUD helper functions for reports.
 * 
 * Note: SQLite files (*.db) are ignored by git to protect patient data privacy.
 */

const path = require('path');

// Target database file path
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'health_copilot.db');

/**
 * Initializes the SQLite database and creates necessary tables if they do not exist.
 * Table: reports
 * Columns:
 * - id: INTEGER PRIMARY KEY AUTOINCREMENT
 * - original_name: TEXT (uploaded filename)
 * - stored_filename: TEXT (sanitized unique disk filename)
 * - file_path: TEXT (relative path in uploads directory)
 * - mime_type: TEXT (e.g., application/pdf, image/png)
 * - category: TEXT (e.g., Blood Test, Metabolic Panel)
 * - status: TEXT ('uploaded', 'extracted', 'analyzed', 'error')
 * - extracted_text: TEXT (raw OCR or PDF text)
 * - ai_summary_json: TEXT (serialized JSON of AI insights)
 * - created_at: DATETIME (ISO timestamp)
 */
function initDatabase() {
  console.log(`[DB Placeholder] Database setup configured for: ${DB_PATH}`);
  // TODO [Hackathon Sprint 2]: Initialize sqlite3.Database instance
  // const sqlite3 = require('sqlite3').verbose();
  // const db = new sqlite3.Database(DB_PATH, ...);
  // db.run(`CREATE TABLE IF NOT EXISTS reports (...)`);

  return {
    status: 'placeholder',
    dbPath: DB_PATH,
    message: 'Database schema placeholder initialized. Ready for sqlite3 connection.'
  };
}

/**
 * Saves a new report record to SQLite.
 * @param {object} reportData
 */
async function saveReport(reportData) {
  // TODO [Hackathon Sprint 2]: Insert record into SQLite
  return {
    status: 'placeholder',
    message: 'Report save placeholder called. Pending database connection.',
    reportData
  };
}

/**
 * Retrieves all report records from SQLite.
 */
async function getAllReports() {
  // TODO [Hackathon Sprint 2]: SELECT * FROM reports ORDER BY created_at DESC
  return [];
}

/**
 * Retrieves a single report record by its database ID.
 * @param {number|string} id
 */
async function getReportById(id) {
  // TODO [Hackathon Sprint 2]: SELECT * FROM reports WHERE id = ?
  return null;
}

module.exports = {
  DB_PATH,
  initDatabase,
  saveReport,
  getAllReports,
  getReportById
};
