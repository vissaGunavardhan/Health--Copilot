# 🏥 Health Copilot — AI-Powered Personal Health Intelligence Platform

[![Team](https://img.shields.io/badge/Represented%20by-The%20Brocode-FFB800?style=for-the-badge&logo=shield)](https://github.com/vissaGunavardhan/Health--Copilot)
[![Author](https://img.shields.io/badge/Author-Vissa%20Gunavardhan-0D9488?style=for-the-badge&logo=github)](https://github.com/vissaGunavardhan)
[![Status](https://img.shields.io/badge/Status-100%25%20Complete%20%26%20Production%20Ready-success?style=for-the-badge)](https://github.com/vissaGunavardhan/Health--Copilot)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **Proudly Represented by The Brocode** | Developed by **Vissa Gunavardhan**
> An accessible, multimodal healthcare assistant that translates complex medical data into actionable insights, tracks 5,000+ patient population cohorts in real time, monitors daily nutrition and medications, and provides 1-tap emergency rescue systems for highway accidents and student distress.

---

## 📑 Table of Contents
- [1. Key Features Overview](#1-key-features-overview)
- [2. Feature Walkthrough](#2-feature-walkthrough)
  - [A. 5,000 Patient Cohort Analytics (A-Z Sequence)](#a-5000-patient-cohort-analytics-a-z-sequence)
  - [B. Age-Wise BMI & Metabolic Calculator](#b-age-wise-bmi--metabolic-calculator)
  - [C. Daily Food, Protein & Hydration Tracker](#c-daily-food-protein--hydration-tracker)
  - [D. Doctor Consultant Check-Up List](#d-doctor-consultant-check-up-list)
  - [E. Emergency Sickness Voice Triggers ("Call Parents / Warden")](#e-emergency-sickness-voice-triggers-call-parents--warden)
  - [F. Highway Accident Emergency SOS & Live GPS Radar](#f-highway-accident-emergency-sos--live-gps-radar)
  - [G. Live Medicine Tracker & Audio Chimes](#g-live-medicine-tracker--audio-chimes)
  - [H. Medicine Photo & Packaging Identifier](#h-medicine-photo--packaging-identifier)
  - [I. Voice Copilot Accessibility](#i-voice-copilot-accessibility)
- [3. Technology Stack](#3-technology-stack)
- [4. Quick Start & Execution](#4-quick-start--execution)
- [5. Project Directory Structure](#5-project-directory-structure)
- [6. Medical Disclaimer](#6-medical-disclaimer)

---

## 1. Key Features Overview

| Feature Module | Capabilities |
| :--- | :--- |
| **📊 Population Health Cohort** | **5,000+ patient records**, 30,000+ biomarkers, dynamic real-time ingestion, **A-Z alphabetical sequence ordering**, and 26-letter quick jumper. |
| **⚖️ Age-Wise BMI Calculator** | BMI category, animated gauge meter, Mifflin-St Jeor BMR, daily calorie/protein goals, and age-bracket clinical advice. |
| **🥗 Daily Food & Hydration Tracker** | Calories (`cal`), Protein (`proties`), and Hydration (`hydration content` in ml & glasses). 1-tap quick food logs and water counter. |
| **📋 Doctor Consultant Checklist** | Synthesizes vitals, symptoms, ongoing meds, and abnormal lab flags. Exportable via Print, Clipboard, or WhatsApp. |
| **🎙️ Emergency Sickness Voice Dial** | Detects *"Call my parents"* or *"Call my hostel warden"*. Triggers instant phone dialing, emergency card, and voice reassurance. |
| **🛣️ Highway Accident SOS Radar** | Detects live GPS coordinates, finds nearest hospitals & police stations, 1-tap dials **112**, **108**, and **1033 NHAI highway helpline**. |
| **⏰ Live Medicine Tracker** | Synchronized digital clock, dose countdown timer, adherence progress bar, and Web Audio API chime reminders. |
| **📸 Medicine Photo Identifier** | Drag-and-drop or camera capture of medicine packaging; extracts active compounds, dosage directions, warnings, and audio readout. |
| **🗣️ Voice Copilot & Accessibility** | Full Web Speech API Speech-to-Text and Text-to-Speech audio engine designed for elderly or illiterate patients. |

---

## 2. Feature Walkthrough

### A. 5,000 Patient Cohort Analytics (A-Z Sequence)
- **Scale**: Pre-seeded with **5,000 realistic clinical records** covering 6 condition archetypes (Diabetes, Dyslipidemia, Anemia, Thyroid, Renal/Liver stress, and Wellness Controls).
- **Dynamic Ingestion**: Uploading any new report or preset immediately increments the cohort database in real time.
- **A-Z Sequence Ordering**: Automatically ordered alphabetically by Patient Name (`A` to `Z`). Includes an interactive A–Z letter bar to filter all records beginning with any specific letter in sub-5ms.

### B. Age-Wise BMI & Metabolic Calculator
- **Inputs**: Age, biological sex, height (cm), weight (kg), and physical activity factor.
- **Outputs**: Body Mass Index ($kg/m^2$), visual animated gauge, Basal Metabolic Rate (BMR), target daily calories, target protein range (1.0–1.3 g/kg), and daily water volume.
- **Age Guidance**: Provides clinical lifestyle recommendations tailored for adolescents (<18), students/youth (18–25), working adults (26–45), mature adults (46–60), and seniors (60+).

### C. Daily Food, Protein & Hydration Tracker
- **Nutrient Bars**: Live progress meters for **Calories** (e.g. 770 / 2,000 kcal), **Protein** (e.g. 28 / 65 g), and **Hydration** (e.g. 1,400 / 2,500 ml • 5.6 glasses).
- **1-Click Quick Add**: Boiled eggs, Dal & Rice, Paneer salad, Chicken breast, Milk, Apples, and `+1 Glass Water (250 ml)`.
- **Database Persistence**: Stores all daily meal logs in SQLite with real-time deletion and date breakdowns.

### D. Doctor Consultant Check-Up List
- **Vitals Snapshot**: Tracks Blood Pressure, Heart Rate, Fasting Blood Glucose, and SpO2.
- **Symptoms Checklist**: Interactive checkboxes for symptoms like thirst, fatigue, dizziness, chest tightness, and acidity.
- **1-Click Sync**: Auto-syncs ongoing medicines from the Live Tracker and abnormal lab values from the latest uploaded report.
- **Sharing**: 1-click **Print / PDF**, **Copy to Clipboard**, and **WhatsApp Share** to doctors or family.

### E. Emergency Sickness Voice Triggers ("Call Parents / Warden")
- Designed for students in hostels or patients too sick/weak to navigate contact lists.
- Users can speak: *"Call my parents"*, *"Call my hostel warden"*, or *"Emergency, I am sick"*.
- The assistant immediately opens the direct phone call (`tel:`), launches the emergency card, speaks reassuring audio, and sounds an alarm siren.

### F. Highway Accident Emergency SOS & Live GPS Radar
- **Live GPS Tracking**: Acquires satellite coordinates (Latitude, Longitude, Highway point) and generates a live Google Maps pin.
- **Emergency Facility Radar**: 1-click search locating nearest 24/7 ICUs, trauma centers, and local police stations.
- **Official Helplines**: Direct speed dials to **112** (Universal), **108** (Ambulance), **1033** (NHAI Highway Road Accident Helpline), **100** (Police), and **1091** (Women Helpline).
- **1-Tap WhatsApp SOS**: Broadcasts GPS coordinates and emergency dispatch text to family and rescue teams.

### G. Live Medicine Tracker & Audio Chimes
- Digital 24-hour synchronized clock with live dosage countdown.
- Synthesizes two-tone alert chimes via Web Audio API when a dose is due.
- Tracks daily adherence percentage with 1-click "Mark Taken" and undo controls.

### H. Medicine Photo & Packaging Identifier
- Upload or photograph medicine strips, boxes, or bottles.
- Matches against clinical drug catalog (Paracetamol, Metformin, Amoxicillin, Atorvastatin, Pantoprazole, Cetirizine, Azithromycin, etc.).
- Displays indications, dosage rules, side-effects, precautions, audio scripts, and includes an **"Add to Live Schedule"** button.

### I. Voice Copilot Accessibility
- High-contrast, large-button interface for elderly and illiterate users.
- Web Speech API speech-to-text input with spoken text-to-speech audio playback.

---

## 3. Technology Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, Web Speech API, Web Audio API, Geolocation API.
- **Backend API**: Python 3 (Flask) & Node.js (Express) dual architecture.
- **Database**: SQLite 3 (`backend/db/health_copilot.db`) with indexing for sub-5ms queries across 5,000+ patient records.
- **Tunneling & Launchers**: Windows Batch scripts, Internet shortcuts (`.url`), and Pinggy SSH tunnels.

---

## 4. Quick Start & Execution

### Option 1: 1-Click Launch (Windows)
Double-click **`START_APP.bat`** in the project folder. It will start the server and open the web dashboard in your browser.

### Option 2: 1-Click Browser Shortcut
Double-click **`OPEN_IN_BROWSER.url`** to open **http://localhost:5000** directly in Chrome/Edge.

### Option 3: Manual Terminal Command
```powershell
# Open terminal in project root
py backend\server.py
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### Option 4: Mobile & Wi-Fi Access
Open **`http://<YOUR-IP>:5000`** (e.g. `http://192.168.90.53:5000`) on any smartphone or tablet connected to the same Wi-Fi.

### Option 5: Global Public Shareable Link
Double-click **`CREATE_PUBLIC_BROWSER_LINK.bat`** to get an instant HTTPS link shareable with evaluators anywhere.

---

## 5. Project Directory Structure

```text
Health--Copilot/
├── 🚀 START_APP.bat                    # 1-Click Windows App Launcher
├── 🌐 OPEN_IN_BROWSER.url              # 1-Click Desktop Browser Shortcut
├── 🌍 CREATE_PUBLIC_BROWSER_LINK.bat    # Global Public HTTPS Link Generator
├── 🔄 PUSH_TO_MY_GITHUB.bat            # 1-Click Push Script for Personal GitHub
├── 📖 README.md                        # Complete Project Documentation
├── ⚙️ .gitignore & .gitattributes
│
├── 📁 frontend/
│   ├── 🌐 index.html                   # Medical UI Dashboard (All 8 Feature Tabs)
│   ├── 📜 script.js                    # Web APIs, BMI Logic, Nutrition & GPS Radar
│   └── 🎨 style.css                    # Responsive Healthcare Theme & SOS Styles
│
├── 📁 backend/
│   ├── 🐍 server.py                    # Flask API Server & 5,000 Patient Cohort Engine
│   ├── ⚡ server.js                    # Node.js Express Server Fallback
│   ├── 📁 routes/                      # REST Endpoints
│   ├── 📁 services/                    # Extraction & AI Summarization
│   ├── 📁 db/                          # SQLite Connection & Schemas
│   └── 📦 package.json                 # Node Dependencies
│
└── 📁 docs/
    ├── 📑 architecture.md              # System Architecture & Data Flow
    └── 📑 api-contract.md              # REST API Specification
```

---

## 6. Medical Disclaimer

> **IMPORTANT NOTICE:** Health Copilot is designed exclusively for educational, organizational, and emergency informational assistance. It does **not** provide clinical diagnosis or certified medical prescriptions. Always consult a licensed physician for medical conditions.

---

### 🌟 Project Attribution
- **Team**: Represented by **The Brocode**
- **Author**: **Vissa Gunavardhan**
- **GitHub**: [https://github.com/vissaGunavardhan/Health--Copilot](https://github.com/vissaGunavardhan/Health--Copilot)
