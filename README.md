# Health Copilot — AI-Powered Personal Health Records Assistant

> **Represented by The Brocode** | An assistive healthcare intelligence platform designed to organize medical records, analyze population-scale patient cohorts, and translate complex laboratory reports into clear, patient-friendly insights.

---

## 1. Project Overview & Features

**Health Copilot**, proudly represented by **The Brocode**, empowers patients and healthcare providers by:
1. **5,000+ Patient Cohort Analytics**: Synthesizes and analyzes a population health dataset of 5,000+ patient records, tracking 30,000+ biomarkers with dynamic real-time updates as new data is uploaded.
2. **Accessible Medical Dashboard**: Clean, intuitive interface supporting digital PDF parsing, camera image OCR, and 1-click clinical sample presets.
3. **Clinical AI Rules & Summarization Engine**: Explains out-of-range metrics in simple language, generates tailored questions for physician consultation, and provides spoken audio read-aloud for illiterate or elderly patients.
4. **Live Medicine Tracker & Chime Reminders**: Real-time digital clock, next-dose countdown ticker, and audio reminders.
5. **Medicine Photo & Packaging Identifier**: Identifies tablets and medicine strips from photos and provides verified clinical uses, dosages, and safety precautions.
6. **Voice Copilot (Microphone Accessibility)**: Full speech-to-text input and spoken audio guidance for users who cannot read or write easily.
7. **Privacy-Preserving SQLite Storage**: Stores all records locally in SQLite (`backend/db/health_copilot.db`).


## 2. Technology Stack

- **Frontend:** HTML5, Vanilla CSS3, Bootstrap 5.3, Bootstrap Icons, Vanilla JavaScript.
- **Backend:** Node.js, Express.js.
- **File Ingestion:** Multer (multipart form handling).
- **Extraction & OCR:** `pdf-parse` (digital PDFs), `tesseract.js` (scanned images & camera captures).
- **AI Engine:** Free / local model options (e.g., Ollama running Llama 3 / Mistral, or Google Gemini API free tier).
- **Database:** SQLite (local relational file-based storage via `sqlite3`).

---

## 3. Project Directory Structure

```
Health-Copilot/
├── frontend/
│   ├── index.html            # Main medical dashboard UI & upload interface
│   ├── style.css             # Clean responsive healthcare theme styling
│   └── script.js             # Drag-and-drop & API health check logic
├── backend/
│   ├── server.js             # Express server entry point (GET /api/health)
│   ├── package.json          # Node dependencies and npm scripts
│   ├── .env.example          # Safe environment template
│   ├── routes/
│   │   └── reports.js        # Report upload and retrieval route handlers
│   ├── services/
│   │   ├── extraction.js     # Text extraction & OCR service stubs
│   │   └── ai.js             # AI health summarization service stubs
│   ├── db/
│   │   └── database.js       # SQLite connection and schema setup
│   └── uploads/
│       └── .gitkeep          # Upload directory anchor (files ignored by Git)
├── docs/
│   ├── api-contract.md       # Planned REST API specification
│   └── architecture.md       # Pipeline data flow and system diagrams
├── .gitignore                # Excludes node_modules, .env, DB files, and uploads
└── README.md                 # Project guide, architecture, and team roles
```

---

## 4. Team Roles & Responsibilities (24-Hour Hackathon)

| Role | Primary Responsibilities | Current Focus |
|---|---|---|
| **Frontend Lead** | UI/UX dashboard, responsive design, drag-and-drop file upload UX, status rendering. | Integrate file upload progress and render AI metrics tables. |
| **Backend Lead** | Express routing, Multer file upload handling, REST endpoints, error handling. | Implement `POST /api/reports/upload` and configure CORS. |
| **AI / OCR Lead** | `pdf-parse` and `tesseract.js` integration, prompt engineering, structured JSON outputs. | Connect `services/extraction.js` to `services/ai.js`. |
| **Data & Docs Lead** | SQLite schema (`db/database.js`), API contracts, demo test data, pitch slides. | Set up local tables and sample de-identified lab reports. |

---

## 5. Getting Started & Testing

### Prerequisites
- Node.js (v18.0.0 or later recommended)
- A web browser (Chrome, Firefox, or Edge)

### Step 1: Backend Setup
Open a terminal in the project root and navigate to the backend directory:
```bash
cd backend
```

Copy the environment example file:
```bash
# Windows PowerShell
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Install backend dependencies:
```bash
npm install
```

Start the backend server:

**Option A (Python — Instant, Zero Setup):**
```bash
cd backend
py server.py
# Or: python server.py
```

**Option B (Node.js Express):**
```bash
cd backend
npm install
npm start
```

Verify backend health in your browser or terminal:
```bash
curl http://localhost:5000/api/health
```

### Step 2: Open Dashboard
- Open `http://localhost:5000/` in your browser (automatically served by the backend server!), OR
- Open `frontend/index.html` directly in your browser.
- Click **"Try Demo Report"** to immediately test the end-to-end extraction and AI summarization pipeline.
- Or drag and drop any medical lab report (PDF, PNG, JPG, or TXT).


---

## 6. Safety & Non-Diagnostic Medical Disclaimer

> **IMPORTANT:** Health Copilot is designed exclusively for educational, organizational, and informational purposes. It is **not** a diagnostic device, certified medical software, or substitute for professional medical judgment. Users should never make clinical decisions or adjust medications without consulting a licensed physician.
