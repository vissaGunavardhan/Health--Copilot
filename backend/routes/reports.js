/**
 * Health Copilot - Report & Assistive Healthcare Routes
 * 
 * Handles:
 * - Report file uploads (via Multer), extraction orchestration, AI summary generation
 * - 5 Realistic Patient Clinical Report Presets
 * - Live Medication Tracking (CRUD, mark taken, schedule)
 * - Medicine Photo & Packaging Identifier
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let multer = null;

try {
  multer = require('multer');
} catch (e) {
  console.warn('[Multer Notice] multer not installed, file upload fallback enabled');
}

const db = require('../db/database');
const { processReportDocument } = require('../services/extraction');
const { generateHealthSummary } = require('../services/ai');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Multer storage if available
let uploadMiddleware = (req, res, next) => next();
if (multer) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${uniqueSuffix}-${safeName}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Supported: PDF, PNG, JPG, JPEG, TXT.`));
    }
  };

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
  });

  uploadMiddleware = upload.single('file');
}

// 5 Realistic Patient Presets Catalog
const PATIENT_SAMPLES = [
  {
    id: 'diabetes_lipid',
    title: 'Type 2 Diabetes & Lipid Panel (Metabolic Profile)',
    category: 'Metabolic Panel',
    patient: 'Robert Chen (54M)',
    summarySnippet: 'Elevated HbA1c (8.2%), Fasting Blood Glucose (168 mg/dL), and Total Cholesterol (245 mg/dL).',
    text: `PATIENT REPORT - METROPOLITAN DIAGNOSTIC LABS
Patient Name: Robert Chen (Age 54, Male)
Report Type: Comprehensive Metabolic & Lipid Screen
Date of Collection: 2026-10-10

METABOLIC & GLYCEMIC MARKERS:
- Fasting Blood Glucose: 168 mg/dL (Reference Range: 70 - 99 mg/dL) [HIGH]
- HbA1c (Average Blood Sugar): 8.2 % (Reference Range: 4.0 - 5.6 %) [HIGH]
- Serum Creatinine: 1.1 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) [NORMAL]
- Blood Urea Nitrogen (BUN): 18 mg/dL (Reference Range: 7 - 20 mg/dL) [NORMAL]
- Sodium: 139 mEq/L (Reference Range: 135 - 145 mEq/L) [NORMAL]
- Potassium: 4.4 mEq/L (Reference Range: 3.5 - 5.1 mEq/L) [NORMAL]

LIPID PANEL:
- Total Cholesterol: 245 mg/dL (Reference Range: 125 - 200 mg/dL) [HIGH]
- HDL (Good) Cholesterol: 34 mg/dL (Reference Range: > 40 mg/dL) [LOW]
- LDL (Bad) Cholesterol: 162 mg/dL (Reference Range: < 100 mg/dL) [HIGH]
- Triglycerides: 280 mg/dL (Reference Range: 50 - 150 mg/dL) [HIGH]

Clinical Notes: Patient reports frequent nighttime urination and afternoon fatigue. Blood pressure 138/88 mmHg.`
  },
  {
    id: 'anemia_cbc',
    title: 'Iron Deficiency Anemia (Complete Blood Count)',
    category: 'Blood Test',
    patient: 'Priya Sharma (28F)',
    summarySnippet: 'Low Hemoglobin (8.9 g/dL), Low RBC (3.4 x10^6/uL), Low MCV (68.2 fL), and Depleted Ferritin (7.2 ng/mL).',
    text: `PATIENT REPORT - METROPOLITAN DIAGNOSTIC LABS
Patient Name: Priya Sharma (Age 28, Female)
Report Type: Complete Blood Count & Iron Studies
Date of Collection: 2026-10-10

COMPLETE BLOOD COUNT (CBC):
- Hemoglobin: 8.9 g/dL (Reference Range: 12.0 - 16.0 g/dL) [LOW]
- Red Blood Cells (RBC): 3.4 x10^6/uL (Reference Range: 4.2 - 5.4 x10^6/uL) [LOW]
- Hematocrit (PCV): 27.5 % (Reference Range: 37.0 - 47.0 %) [LOW]
- Mean Corpuscular Volume (MCV): 68.2 fL (Reference Range: 80.0 - 100.0 fL) [LOW]
- White Blood Cells (WBC): 6.2 x10^3/uL (Reference Range: 4.5 - 11.0 x10^3/uL) [NORMAL]
- Platelet Count: 390 x10^3/uL (Reference Range: 150 - 450 x10^3/uL) [NORMAL]

IRON PROFILE:
- Serum Ferritin (Iron Stores): 7.2 ng/mL (Reference Range: 15 - 150 ng/mL) [LOW]

Clinical Notes: Patient presents with persistent lightheadedness, pale conjunctiva, brittle nails, and chronic fatigue.`
  },
  {
    id: 'thyroid_vitamins',
    title: 'Thyroid Dysfunction & Vitamin Deficiencies',
    category: 'Thyroid Panel',
    patient: 'Margaret Miller (42F)',
    summarySnippet: 'Elevated TSH (7.8 uIU/mL - Hypothyroidism), Low Vitamin D (14.5 ng/mL), and Low Vitamin B12 (175 pg/mL).',
    text: `PATIENT REPORT - METROPOLITAN DIAGNOSTIC LABS
Patient Name: Margaret Miller (Age 42, Female)
Report Type: Thyroid Hormone & Micronutrient Evaluation
Date of Collection: 2026-10-10

THYROID PROFILE:
- Thyroid Stimulating Hormone (TSH): 7.8 uIU/mL (Reference Range: 0.4 - 4.0 uIU/mL) [HIGH]

VITAMINS & MINERALS:
- Vitamin D (25-OH): 14.5 ng/mL (Reference Range: 30.0 - 100.0 ng/mL) [LOW]
- Vitamin B12: 175 pg/mL (Reference Range: 200 - 900 pg/mL) [LOW]
- Fasting Blood Glucose: 91 mg/dL (Reference Range: 70 - 99 mg/dL) [NORMAL]
- Hemoglobin: 12.4 g/dL (Reference Range: 12.0 - 16.0 g/dL) [NORMAL]

Clinical Notes: Reports unexplained weight gain, cold intolerance, dry skin, muscle aches, and morning brain fog.`
  },
  {
    id: 'hepatic_renal',
    title: 'Renal & Hepatic Stress (Kidney & Liver Markers)',
    category: 'Metabolic Panel',
    patient: 'David Miller (61M)',
    summarySnippet: 'Elevated Serum Creatinine (2.1 mg/dL), High BUN (38 mg/dL), Elevated Liver Enzymes (ALT 72 U/L, AST 65 U/L).',
    text: `PATIENT REPORT - METROPOLITAN DIAGNOSTIC LABS
Patient Name: David Miller (Age 61, Male)
Report Type: Comprehensive Renal & Hepatic Assessment
Date of Collection: 2026-10-10

KIDNEY FUNCTION (RENAL):
- Serum Creatinine: 2.1 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) [HIGH]
- Blood Urea Nitrogen (BUN): 38 mg/dL (Reference Range: 7 - 20 mg/dL) [HIGH]
- Potassium: 5.4 mEq/L (Reference Range: 3.5 - 5.1 mEq/L) [HIGH]
- Sodium: 136 mEq/L (Reference Range: 135 - 145 mEq/L) [NORMAL]

LIVER FUNCTION (HEPATIC):
- ALT (Liver Enzyme SGPT): 72 U/L (Reference Range: 7 - 56 U/L) [HIGH]
- AST (Liver/Heart Enzyme SGOT): 65 U/L (Reference Range: 10 - 40 U/L) [HIGH]
- Total Cholesterol: 190 mg/dL (Reference Range: 125 - 200 mg/dL) [NORMAL]

Clinical Notes: Mild bilateral lower-extremity swelling. Evaluation of medication tolerance and hydration.`
  },
  {
    id: 'healthy_baseline',
    title: 'Healthy Annual Wellness Checkup (All Normal)',
    category: 'Blood Test',
    patient: 'Alex Johnson (35M)',
    summarySnippet: 'All 12 biomarkers in optimal reference intervals. Strong metabolic and cardiovascular stability.',
    text: `PATIENT REPORT - METROPOLITAN DIAGNOSTIC LABS
Patient Name: Alex Johnson (Age 35, Male)
Report Type: Routine Annual Executive Physical
Date of Collection: 2026-10-10

COMPLETE BLOOD COUNT:
- Hemoglobin: 15.2 g/dL (Reference Range: 13.0 - 17.5 g/dL) [NORMAL]
- White Blood Cells (WBC): 5.9 x10^3/uL (Reference Range: 4.5 - 11.0 x10^3/uL) [NORMAL]
- Platelet Count: 260 x10^3/uL (Reference Range: 150 - 450 x10^3/uL) [NORMAL]
- Hematocrit (PCV): 44.5 % (Reference Range: 37.0 - 50.0 %) [NORMAL]

METABOLIC & LIPID PROFILE:
- Fasting Blood Glucose: 86 mg/dL (Reference Range: 70 - 99 mg/dL) [NORMAL]
- Serum Creatinine: 0.85 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) [NORMAL]
- Blood Urea Nitrogen (BUN): 12 mg/dL (Reference Range: 7 - 20 mg/dL) [NORMAL]
- Total Cholesterol: 165 mg/dL (Reference Range: 125 - 200 mg/dL) [NORMAL]
- HDL (Good) Cholesterol: 56 mg/dL (Reference Range: > 40 mg/dL) [NORMAL]
- LDL (Bad) Cholesterol: 88 mg/dL (Reference Range: < 100 mg/dL) [NORMAL]
- Triglycerides: 95 mg/dL (Reference Range: 50 - 150 mg/dL) [NORMAL]
- Vitamin D (25-OH): 38.0 ng/mL (Reference Range: 30.0 - 100.0 ng/mL) [NORMAL]

Clinical Notes: Healthy asymptomatic adult. Active lifestyle; no current medications.`
  }
];

// Presets list
router.get('/samples', (req, res) => {
  res.status(200).json({
    success: true,
    count: PATIENT_SAMPLES.length,
    data: PATIENT_SAMPLES.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category,
      patient: s.patient,
      summarySnippet: s.summarySnippet
    }))
  });
});

// Load and analyze patient preset
router.post('/samples/:id', async (req, res, next) => {
  try {
    const sample = PATIENT_SAMPLES.find(s => s.id === req.params.id) || PATIENT_SAMPLES[0];
    const storedName = `sample-${sample.id}-${Date.now()}.txt`;
    const samplePath = path.join(UPLOADS_DIR, storedName);

    fs.writeFileSync(samplePath, sample.text, 'utf8');

    const initial = await db.saveReport({
      originalName: `${sample.patient} - ${sample.title}.txt`,
      storedFilename: storedName,
      filePath: samplePath,
      mimeType: 'text/plain',
      category: sample.category,
      status: 'uploaded',
      notes: `Preset scenario: ${sample.patient}`
    });

    const aiResult = await generateHealthSummary(sample.text, sample.category);

    const updated = await db.updateReport(initial.id, {
      status: 'analyzed',
      extractedText: sample.text,
      aiSummary: aiResult.summary
    });

    res.status(201).json({
      success: true,
      message: `Patient sample '${sample.title}' loaded and analyzed successfully`,
      data: updated || initial
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/reports
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, category } = req.query;
    const reports = await db.getAllReports({ limit, category });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await db.getReportById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reports/upload
 */
router.post('/upload', (req, res, next) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: 'Upload Error', message: err.message });
    try {
      const file = req.file;
      const category = req.body.category || 'Blood Test';
      const notes = req.body.notes || '';

      if (!file) return res.status(400).json({ success: false, error: 'Missing File' });

      const initialRecord = await db.saveReport({
        originalName: file.originalname,
        storedFilename: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        category,
        status: 'uploaded',
        notes
      });

      const extractionResult = await processReportDocument(file.path, file.mimetype, file.originalname);
      const extractedText = extractionResult.text || '';
      const aiResult = await generateHealthSummary(extractedText, category);

      const updatedReport = await db.updateReport(initialRecord.id, {
        status: 'analyzed',
        extractedText,
        aiSummary: aiResult.summary
      });

      res.status(201).json({ success: true, message: 'Report analyzed successfully', data: updatedReport || initialRecord });
    } catch (e) {
      next(e);
    }
  });
});

/**
 * DELETE /api/reports/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await db.getReportById(id);
    if (report && report.filePath && fs.existsSync(report.filePath)) {
      try { fs.unlinkSync(report.filePath); } catch (e) {}
    }
    await db.deleteReport(id);
    res.status(200).json({ success: true, message: 'Report deleted', reportId: Number(id) });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/reports/demo
 */
router.post('/demo', async (req, res) => {
  const sampleId = (req.body && req.body.sampleId) ? req.body.sampleId : 'diabetes_lipid';
  const sample = PATIENT_SAMPLES.find(s => s.id === sampleId) || PATIENT_SAMPLES[0];
  const initial = await db.saveReport({
    originalName: `${sample.patient} - ${sample.title}.txt`,
    storedFilename: `demo-${Date.now()}.txt`,
    filePath: '',
    mimeType: 'text/plain',
    category: sample.category,
    status: 'uploaded',
    notes: 'Demo test'
  });
  const aiResult = await generateHealthSummary(sample.text, sample.category);
  const updated = await db.updateReport(initial.id, {
    status: 'analyzed',
    extractedText: sample.text,
    aiSummary: aiResult.summary
  });
  res.status(201).json({ success: true, message: 'Demo analyzed', data: updated || initial });
});

module.exports = router;
