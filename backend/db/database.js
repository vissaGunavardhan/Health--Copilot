/**
 * Health Copilot - SQLite Database Layer
 * 
 * Manages SQLite local storage for medical reports, extracted text,
 * and AI-generated patient insights.
 */

const path = require('path');
const fs = require('fs');

// Target database file path
const DB_DIR = path.join(__dirname);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'health_copilot.db');

let sqlite3 = null;
let db = null;
let useJsonFallback = false;
const FALLBACK_JSON_PATH = path.join(DB_DIR, 'health_copilot_fallback.json');

// Attempt to load sqlite3
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  console.warn('[DB Notice] sqlite3 module not available, using robust JSON store fallback:', err.message);
  useJsonFallback = true;
}

/**
 * Initialize Database and create tables
 */
function initDatabase() {
  if (!useJsonFallback && sqlite3) {
    try {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('[DB Error] Failed to open SQLite database:', err.message);
          useJsonFallback = true;
          initJsonFallback();
        } else {
          console.log(`[DB Success] SQLite connected at: ${DB_PATH}`);
          createTables();
        }
      });
      return { status: 'connected', type: 'sqlite3', dbPath: DB_PATH };
    } catch (e) {
      console.warn('[DB Warning] SQLite initialization failed, activating fallback:', e.message);
      useJsonFallback = true;
      initJsonFallback();
      return { status: 'fallback', type: 'json-store', dbPath: FALLBACK_JSON_PATH };
    }
  } else {
    initJsonFallback();
    return { status: 'fallback', type: 'json-store', dbPath: FALLBACK_JSON_PATH };
  }
}

function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      category TEXT DEFAULT 'General',
      status TEXT DEFAULT 'uploaded',
      extracted_text TEXT DEFAULT '',
      ai_summary_json TEXT DEFAULT '{}',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
  `;
  db.exec(schema, (err) => {
    if (err) {
      console.error('[DB Error] Schema creation failed:', err.message);
    } else {
      console.log('[DB Success] Reports table initialized successfully.');
    }
  });
}

function initJsonFallback() {
  if (!fs.existsSync(FALLBACK_JSON_PATH)) {
    fs.writeFileSync(FALLBACK_JSON_PATH, JSON.stringify({ reports: [], nextId: 1 }, null, 2), 'utf8');
  }
}

function readJsonFallback() {
  initJsonFallback();
  try {
    const raw = fs.readFileSync(FALLBACK_JSON_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { reports: [], nextId: 1 };
  }
}

function writeJsonFallback(data) {
  fs.writeFileSync(FALLBACK_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Saves a new report record
 * @param {object} reportData
 * @returns {Promise<object>}
 */
function saveReport(reportData) {
  return new Promise((resolve, reject) => {
    const originalName = reportData.original_name || reportData.originalName || 'document';
    const storedFilename = reportData.stored_filename || reportData.storedFilename || originalName;
    const filePath = reportData.file_path || reportData.filePath || '';
    const mimeType = reportData.mime_type || reportData.mimeType || 'application/octet-stream';
    const category = reportData.category || 'General';
    const status = reportData.status || 'uploaded';
    const extractedText = reportData.extracted_text || reportData.extractedText || '';
    const aiSummaryJson = typeof reportData.ai_summary_json === 'string'
      ? reportData.ai_summary_json
      : JSON.stringify(reportData.ai_summary_json || reportData.aiSummary || {});
    const notes = reportData.notes || '';
    const createdAt = reportData.created_at || new Date().toISOString();

    if (!useJsonFallback && db) {
      const sql = `
        INSERT INTO reports (
          original_name, stored_filename, file_path, mime_type, category,
          status, extracted_text, ai_summary_json, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(
        sql,
        [originalName, storedFilename, filePath, mimeType, category, status, extractedText, aiSummaryJson, notes, createdAt],
        function (err) {
          if (err) return reject(err);
          getReportById(this.lastID).then(resolve).catch(reject);
        }
      );
    } else {
      const store = readJsonFallback();
      const newId = store.nextId || (store.reports.length + 1);
      const record = {
        id: newId,
        original_name: originalName,
        stored_filename: storedFilename,
        file_path: filePath,
        mime_type: mimeType,
        category,
        status,
        extracted_text: extractedText,
        ai_summary_json: aiSummaryJson,
        notes,
        created_at: createdAt
      };
      store.reports.push(record);
      store.nextId = newId + 1;
      writeJsonFallback(store);
      resolve(formatReportRow(record));
    }
  });
}

/**
 * Retrieves all report records
 * @param {object} [options]
 * @returns {Promise<Array>}
 */
function getAllReports(options = {}) {
  return new Promise((resolve, reject) => {
    const limit = parseInt(options.limit, 10) || 50;
    const category = options.category;
    const sort = options.sort || 'name_asc';
    const letter = options.letter || '';

    if (!useJsonFallback && db) {
      let sql = 'SELECT * FROM reports WHERE 1=1';
      const params = [];
      if (category && category !== 'All') {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (letter) {
        sql += ' AND original_name LIKE ?';
        params.push(`${letter}%`);
      }
      const orderBy = (sort === 'name_desc')
        ? 'ORDER BY original_name COLLATE NOCASE DESC'
        : (sort === 'id_desc' ? 'ORDER BY id DESC' : 'ORDER BY original_name COLLATE NOCASE ASC');

      sql += ` ${orderBy} LIMIT ?`;
      params.push(limit);

      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(formatReportRow));
      });
    } else {
      const store = readJsonFallback();
      let reports = [...store.reports];
      if (category && category !== 'All') {
        reports = reports.filter((r) => r.category === category);
      }
      if (letter) {
        reports = reports.filter((r) => (r.original_name || '').toUpperCase().startsWith(letter.toUpperCase()));
      }
      reports.sort((a, b) => (a.original_name || '').localeCompare(b.original_name || ''));
      resolve(reports.slice(0, limit).map(formatReportRow));
    }
  });
}

/**
 * Retrieves a single report record by ID
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
function getReportById(id) {
  return new Promise((resolve, reject) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return resolve(null);

    if (!useJsonFallback && db) {
      db.get('SELECT * FROM reports WHERE id = ?', [numId], (err, row) => {
        if (err) return reject(err);
        resolve(row ? formatReportRow(row) : null);
      });
    } else {
      const store = readJsonFallback();
      const row = store.reports.find((r) => r.id === numId);
      resolve(row ? formatReportRow(row) : null);
    }
  });
}

/**
 * Updates an existing report
 * @param {number|string} id
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
function updateReport(id, updates) {
  return new Promise((resolve, reject) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return resolve(null);

    if (!useJsonFallback && db) {
      const fields = [];
      const values = [];

      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.extracted_text !== undefined || updates.extractedText !== undefined) {
        fields.push('extracted_text = ?');
        values.push(updates.extracted_text || updates.extractedText);
      }
      if (updates.ai_summary_json !== undefined || updates.aiSummary !== undefined) {
        fields.push('ai_summary_json = ?');
        const val = updates.ai_summary_json || updates.aiSummary;
        values.push(typeof val === 'string' ? val : JSON.stringify(val));
      }
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.category !== undefined) {
        fields.push('category = ?');
        values.push(updates.category);
      }

      if (fields.length === 0) {
        return getReportById(numId).then(resolve).catch(reject);
      }

      values.push(numId);
      const sql = `UPDATE reports SET ${fields.join(', ')} WHERE id = ?`;
      db.run(sql, values, function (err) {
        if (err) return reject(err);
        getReportById(numId).then(resolve).catch(reject);
      });
    } else {
      const store = readJsonFallback();
      const idx = store.reports.findIndex((r) => r.id === numId);
      if (idx === -1) return resolve(null);

      const record = store.reports[idx];
      if (updates.status !== undefined) record.status = updates.status;
      if (updates.extracted_text !== undefined || updates.extractedText !== undefined) {
        record.extracted_text = updates.extracted_text || updates.extractedText;
      }
      if (updates.ai_summary_json !== undefined || updates.aiSummary !== undefined) {
        const val = updates.ai_summary_json || updates.aiSummary;
        record.ai_summary_json = typeof val === 'string' ? val : JSON.stringify(val);
      }
      if (updates.notes !== undefined) record.notes = updates.notes;
      if (updates.category !== undefined) record.category = updates.category;

      store.reports[idx] = record;
      writeJsonFallback(store);
      resolve(formatReportRow(record));
    }
  });
}

/**
 * Deletes a report by ID
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
function deleteReport(id) {
  return new Promise((resolve, reject) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return resolve(false);

    if (!useJsonFallback && db) {
      db.run('DELETE FROM reports WHERE id = ?', [numId], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    } else {
      const store = readJsonFallback();
      const initialLen = store.reports.length;
      store.reports = store.reports.filter((r) => r.id !== numId);
      if (store.reports.length < initialLen) {
        writeJsonFallback(store);
        resolve(true);
      } else {
        resolve(false);
      }
    }
  });
}

/**
 * Formats a report database record into API-friendly shape
 */
function formatReportRow(row) {
  if (!row) return null;
  let parsedSummary = null;
  try {
    parsedSummary = typeof row.ai_summary_json === 'string'
      ? JSON.parse(row.ai_summary_json)
      : (row.ai_summary_json || null);
  } catch (e) {
    parsedSummary = { overview: 'Summary could not be parsed.', raw: row.ai_summary_json };
  }

  return {
    id: row.id,
    originalName: row.original_name,
    storedFilename: row.stored_filename,
    filePath: row.file_path,
    mimeType: row.mime_type,
    category: row.category,
    status: row.status,
    extractedText: row.extracted_text,
    aiSummary: parsedSummary,
    notes: row.notes || '',
    uploadedAt: row.created_at,
    createdAt: row.created_at
  };
}

module.exports = {
  DB_PATH,
  initDatabase,
  saveReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport
};
