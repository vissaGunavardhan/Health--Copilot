# Health Copilot — API Contract Specification

This document defines the RESTful API contract between the **Frontend Client** and the **Express Backend Service** for the Health Copilot application.

---

## 1. Overview & Base URL

- **Development Base URL:** `http://localhost:5000/api`
- **Default Content-Type:** `application/json` (except file uploads using `multipart/form-data`)
- **Protocol:** HTTP (Local dev) / HTTPS (Production)

---

## 2. API Endpoints

### 2.1 Health Check

Verifies backend server availability and sprint status.

- **Endpoint:** `GET /health`
- **Headers:** None required
- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "Health Copilot API",
  "version": "1.0.0",
  "timestamp": "2026-10-10T05:30:00.000Z",
  "environment": "development",
  "features": {
    "reportsApi": "placeholder",
    "textExtraction": "pending-sprint-3",
    "aiSummaries": "pending-sprint-4",
    "database": "pending-sprint-2"
  }
}
```

---

### 2.2 Upload Health Report

Uploads a patient's lab report or medical document file (PDF or image).

- **Endpoint:** `POST /reports/upload`
- **Content-Type:** `multipart/form-data`
- **Request Form Data:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `file` | Binary File | Yes | Medical report file (`.pdf`, `.png`, `.jpg`, `.jpeg`, max 10MB) |
  | `category` | String | No | Category tag (e.g., `Blood Test`, `Lipid Profile`, `Prescription`, `Radiology`, `Other`) |
  | `notes` | String | No | Optional patient notes or symptoms |

- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Report uploaded successfully",
  "data": {
    "id": 1,
    "originalName": "cbc_blood_test.pdf",
    "category": "Blood Test",
    "status": "uploaded",
    "uploadedAt": "2026-10-10T05:35:00.000Z"
  }
}
```

- **Error Responses:**
  - `400 Bad Request`: Missing file or unsupported file extension.
  - `413 Payload Too Large`: File exceeds the 10MB limit.

---

### 2.3 List All Reports

Retrieves a list of previously uploaded medical records.

- **Endpoint:** `GET /reports`
- **Query Parameters:**
  - `limit` (optional, default: 20): Number of records to return.
  - `category` (optional): Filter by report category.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "originalName": "cbc_blood_test.pdf",
      "category": "Blood Test",
      "status": "analyzed",
      "uploadedAt": "2026-10-10T05:35:00.000Z"
    }
  ]
}
```

---

### 2.4 Get Single Report Details & AI Summary

Retrieves metadata, extracted text, and the structured AI-generated health summary for a specific report.

- **Endpoint:** `GET /reports/:id`
- **URL Parameters:**
  - `id` (integer): Unique database ID of the report.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalName": "cbc_blood_test.pdf",
    "category": "Blood Test",
    "status": "analyzed",
    "uploadedAt": "2026-10-10T05:35:00.000Z",
    "extractedTextSnippet": "Hemoglobin: 11.2 g/dL (Reference: 13.8 - 17.2)...",
    "aiSummary": {
      "overview": "Your Complete Blood Count (CBC) shows mostly typical results with mild variations in hemoglobin levels.",
      "keyFindings": [
        "Hemoglobin is slightly lower than standard reference values.",
        "Platelet count and White Blood Cell count are within normal limits."
      ],
      "metrics": [
        {
          "testName": "Hemoglobin",
          "resultValue": "11.2",
          "unit": "g/dL",
          "referenceRange": "13.8 - 17.2",
          "flag": "low"
        },
        {
          "testName": "White Blood Cells",
          "resultValue": "6.5",
          "unit": "x10^3/uL",
          "referenceRange": "4.5 - 11.0",
          "flag": "normal"
        }
      ],
      "doctorQuestions": [
        "Could my mild hemoglobin level explain any recent fatigue?",
        "Should I consider dietary iron adjustments or follow-up testing?"
      ],
      "disclaimer": "Informational simplification only. Please review all test findings with your physician."
    }
  }
}
```

- **Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Report not found"
}
```

---

### 2.5 Trigger Report Analysis (Extraction + AI)

Triggers or re-triggers text extraction (PDF / OCR) and the AI summary generation pipeline for a previously uploaded file.

- **Endpoint:** `POST /reports/:id/analyze`
- **URL Parameters:**
  - `id` (integer): ID of report to process.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Report analysis completed successfully",
  "reportId": 1,
  "status": "analyzed"
}
```

---

## 3. Standard Error Structure

All error responses return the following JSON format:

```json
{
  "success": false,
  "error": "Short error code or title",
  "message": "Human-readable description of what went wrong",
  "timestamp": "2026-10-10T05:30:00.000Z"
}
```
