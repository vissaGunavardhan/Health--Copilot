# Health Copilot — AI-Powered Personal Health Records Assistant

> **Hackathon Prototype** | An assistive tool designed to organize personal medical records and translate complex laboratory reports into clear, patient-friendly insights.

---

## 1. Project Overview

Medical laboratory test reports and clinical summaries are often laden with dense jargon, abbreviated units, and obscure reference ranges that leave patients feeling confused and anxious.

**Health Copilot** empowers patients to take control of their health data by:
1. Providing a clean, intuitive drag-and-drop dashboard for uploading medical lab reports (PDFs and images).
2. Extracting raw document text using PDF parsing and OCR (Optical Character Recognition).
3. Utilizing AI models to summarize laboratory findings, explain out-of-range metrics in accessible terms, and produce clarifying questions for consultations with physicians.
4. Persisting records locally in a lightweight SQLite database to maintain privacy.

---

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

Start the Express development server:
```bash
npm run dev
# Or standard start:
npm start
```

Verify backend health in your browser or terminal:
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "Health Copilot API",
  "version": "1.0.0"
}
```

### Step 2: Frontend Setup
You can view the frontend simply by opening the HTML file:
- Open `frontend/index.html` directly in your web browser, OR
- Serve it via VS Code's Live Server extension or Python simple server:
  ```bash
  # Optional: from project root
  npx serve frontend
  ```
- Once the backend is running on port 5000, click the **"Check API"** button in the dashboard navigation bar to confirm live connectivity.

---

## 6. Safety & Non-Diagnostic Medical Disclaimer

> **IMPORTANT:** Health Copilot is designed exclusively for educational, organizational, and informational purposes. It is **not** a diagnostic device, certified medical software, or substitute for professional medical judgment. Users should never make clinical decisions or adjust medications without consulting a licensed physician.
