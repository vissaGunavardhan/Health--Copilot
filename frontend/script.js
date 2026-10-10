/**
 * Health Copilot v2.0 — Frontend Application Script
 * Represented by The Brocode
 * 
 * Features:
 * - 5,000 Patient Cohort Analytics & Live Health Data Analysis
 * - 5 Realistic Patient Report Presets & Document OCR Analysis
 * - Live Medication Tracking, Digital Clock & Real-Time Chime Reminders
 * - Medicine Photo & Packaging Identifier with Clinical Drug Database
 * - Speech-to-Text Microphone Dictation & Spoken Text-to-Speech Accessibility
 */

// Dynamically resolve API URL
const API_BASE_URL = (window.location.port === '5000' || window.location.host.includes('localhost:5000'))
  ? '/api'
  : 'http://localhost:5000/api';

// State
let currentSelectedFile = null;
let currentReportData = null;
let cachedReports = [];
let cachedMedications = [];
let chimeEnabled = true;
let isListening = false;
let speechRecognition = null;
let currentUtterance = null;
let identifiedMedicineData = null;

// Cohort pagination state
let cohortCurrentPage = 1;
let cohortTotalPages = 1;
let cohortSearchQuery = '';
let cohortCategoryFilter = 'All';

// Audio Chime Synthesizer using Web Audio API
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupLiveClock();
  setupSpeechEngines();
  setupReportEvents();
  setupCohortAnalyticsEvents();
  setupMedicationEvents();
  setupMedicineIdentifierEvents();
  setupVoiceCopilotEvents();
  setupBackendHealthCheck();

  // Load initial data
  checkBackendHealth().then(() => {
    fetchReportsList();
    fetchMedicationsList();
    fetchCohortAnalytics();
    fetchCohortRecords(1);
  });
});

// =========================================================================
// 1. LIVE SYSTEM CLOCK & REMINDER TICKER
// =========================================================================
function setupLiveClock() {
  const liveClockText = document.getElementById('liveClockText');
  
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (liveClockText) liveClockText.textContent = timeStr;
    evaluateNextDoseTime(now);
  }

  updateClock();
  setInterval(updateClock, 1000);
}

function evaluateNextDoseTime(now) {
  const countdownText = document.getElementById('nextDoseCountdownText');
  if (!countdownText || cachedMedications.length === 0) {
    if (countdownText) countdownText.textContent = 'No medications scheduled for today.';
    return;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const pendingMeds = cachedMedications.filter(m => !m.takenToday);

  if (pendingMeds.length === 0) {
    countdownText.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-circle-fill"></i> All scheduled medications have been taken today! Excellent adherence.</span>';
    return;
  }

  // Find next upcoming medicine
  let closestMed = null;
  let minDiff = Infinity;

  pendingMeds.forEach(m => {
    const [h, min] = (m.timeOfDay || '08:00').split(':').map(Number);
    const medMinutes = h * 60 + min;
    let diff = medMinutes - currentMinutes;
    if (diff < 0) diff += 24 * 60; // if tomorrow morning

    if (diff < minDiff) {
      minDiff = diff;
      closestMed = m;
    }
  });

  if (closestMed) {
    const hours = Math.floor(minDiff / 60);
    const mins = minDiff % 60;
    const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

    if (minDiff === 0 || minDiff === 1) {
      countdownText.innerHTML = `
        <span class="text-danger fw-bold mic-pulse d-inline-block px-2 py-1 rounded bg-danger-subtle">
          <i class="bi bi-exclamation-triangle-fill"></i> Time to take now: ${escapeHtml(closestMed.name)} (${escapeHtml(closestMed.dosage)}) — ${escapeHtml(closestMed.mealTiming)}
        </span>
      `;
      if (now.getSeconds() === 0 && chimeEnabled) playChimeSound();
    } else {
      countdownText.innerHTML = `
        <span><i class="bi bi-hourglass-split text-primary"></i> Next dose in <strong>${timeLabel}</strong>: <strong>${escapeHtml(closestMed.name)}</strong> (${escapeHtml(closestMed.dosage)}) • ${escapeHtml(closestMed.mealTiming)} at ${escapeHtml(closestMed.timeOfDay)}</span>
      `;
    }
  }
}

function playChimeSound() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.warn('Audio chime notice:', e);
  }
}

// =========================================================================
// 2. SPEECH ENGINE (RECOGNITION & SYNTHESIS FOR ACCESSIBILITY)
// =========================================================================
function setupSpeechEngines() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';

    speechRecognition.onstart = () => {
      isListening = true;
      updateMicUI(true);
    };

    speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceTranscript(transcript);
    };

    speechRecognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      isListening = false;
      updateMicUI(false);
    };

    speechRecognition.onend = () => {
      isListening = false;
      updateMicUI(false);
    };
  }
}

function speakText(text, onComplete) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported on this browser.');
    return;
  }

  window.speechSynthesis.cancel();
  if (!text || text.trim().length === 0) return;

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.95;
  currentUtterance.pitch = 1.0;

  currentUtterance.onend = () => {
    if (onComplete) onComplete();
  };

  window.speechSynthesis.speak(currentUtterance);
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// =========================================================================
// 3. TAB 1: LAB REPORTS & 5 PATIENT SCENARIOS
// =========================================================================
function setupReportEvents() {
  const dropzoneContainer = document.getElementById('dropzoneContainer');
  const reportFileInput = document.getElementById('reportFileInput');
  const browseFileBtn = document.getElementById('browseFileBtn');
  const clearFileBtn = document.getElementById('clearFileBtn');
  const analyzeReportBtn = document.getElementById('analyzeReportBtn');
  const demoReportBtn = document.getElementById('demoReportBtn');
  const voiceNoteBtn = document.getElementById('voiceNoteBtn');
  const speakReportBtn = document.getElementById('speakReportBtn');
  const speakOverviewBtn = document.getElementById('speakOverviewBtn');
  const speakQuestionsBtn = document.getElementById('speakQuestionsBtn');
  const copyQuestionsBtn = document.getElementById('copyQuestionsBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

  // File picker trigger
  browseFileBtn.addEventListener('click', (e) => { e.stopPropagation(); reportFileInput.click(); });
  dropzoneContainer.addEventListener('click', () => reportFileInput.click());

  reportFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) handleFileSelection(e.target.files[0]);
  });

  // Drag and drop
  ['dragenter', 'dragover'].forEach(name => {
    dropzoneContainer.addEventListener(name, (e) => { e.preventDefault(); e.stopPropagation(); dropzoneContainer.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(name => {
    dropzoneContainer.addEventListener(name, (e) => { e.preventDefault(); e.stopPropagation(); dropzoneContainer.classList.remove('drag-active'); });
  });
  dropzoneContainer.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length > 0) handleFileSelection(e.dataTransfer.files[0]);
  });

  clearFileBtn.addEventListener('click', (e) => { e.stopPropagation(); resetFileSelection(); });
  analyzeReportBtn.addEventListener('click', handleUploadAndAnalyze);
  if (demoReportBtn) demoReportBtn.addEventListener('click', () => loadPresetSample('diabetes_lipid'));

  // Voice note dictation
  if (voiceNoteBtn) {
    voiceNoteBtn.addEventListener('click', () => {
      startDictationIntoInput(document.getElementById('reportNotesInput'), voiceNoteBtn);
    });
  }

  // Audio read-aloud buttons
  if (speakReportBtn) {
    speakReportBtn.addEventListener('click', () => toggleReadAloudReport(speakReportBtn));
  }
  if (speakOverviewBtn) {
    speakOverviewBtn.addEventListener('click', () => {
      if (currentReportData && currentReportData.aiSummary) {
        speakText(currentReportData.aiSummary.overview);
      }
    });
  }
  if (speakQuestionsBtn) {
    speakQuestionsBtn.addEventListener('click', () => {
      if (currentReportData && currentReportData.aiSummary && currentReportData.aiSummary.doctorQuestions) {
        const text = "Here are the suggested questions to ask your doctor: " + currentReportData.aiSummary.doctorQuestions.join('. ');
        speakText(text);
      }
    });
  }
  if (copyQuestionsBtn) copyQuestionsBtn.addEventListener('click', handleCopyQuestions);
  if (printReportBtn) printReportBtn.addEventListener('click', () => window.print());
  if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', fetchReportsList);
}

function handleFileSelection(file) {
  const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'txt'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showStatusAlert('danger', `Unsupported file type (.${ext}). Upload PDF, PNG, JPG, or TXT.`);
    resetFileSelection();
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showStatusAlert('danger', 'File size exceeds 10MB limit.');
    resetFileSelection();
    return;
  }
  currentSelectedFile = file;
  document.getElementById('selectedFileName').textContent = file.name;
  document.getElementById('selectedFileSize').textContent = formatBytes(file.size);
  document.getElementById('selectedFileBox').style.display = 'block';
  showStatusAlert('info', `Selected: <strong>${escapeHtml(file.name)}</strong>. Click "Upload & Analyze Report".`);
}

function resetFileSelection() {
  currentSelectedFile = null;
  document.getElementById('reportFileInput').value = '';
  document.getElementById('selectedFileBox').style.display = 'none';
  document.getElementById('uploadStatusAlert').classList.add('d-none');
}

async function handleUploadAndAnalyze() {
  if (!currentSelectedFile) {
    showStatusAlert('warning', 'Please select a health report file first.');
    return;
  }
  setLoadingState(true, 'Extracting Biomarkers & Analyzing...');
  showStatusAlert('info', '<div class="d-flex align-items-center"><span class="spinner-border spinner-border-sm me-2"></span> Running OCR text extraction and clinical rules engine...</div>');

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('category', document.getElementById('reportCategorySelect').value);
  formData.append('notes', document.getElementById('reportNotesInput').value.trim());

  try {
    const res = await fetch(`${API_BASE_URL}/reports/upload`, { method: 'POST', body: formData });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || 'Upload failed');

    showStatusAlert('success', '<i class="bi bi-check-circle me-1"></i> Report analyzed successfully!');
    renderReportDetails(result.data);
    resetFileSelection();
    fetchReportsList();
    fetchCohortAnalytics();
    fetchCohortRecords(1);
  } catch (err) {
    showStatusAlert('danger', `Error: ${escapeHtml(err.message)}`);
  } finally {
    setLoadingState(false);
  }
}

// 1-Click Preset Patient Scenarios Loader
window.loadPresetSample = async function(sampleId) {
  const reportsTabBtn = document.getElementById('tab-reports-btn');
  if (reportsTabBtn && !reportsTabBtn.classList.contains('active')) {
    reportsTabBtn.click();
  }

  setLoadingState(true, 'Loading Patient Scenario...');
  showStatusAlert('info', '<div class="d-flex align-items-center"><span class="spinner-border spinner-border-sm me-2"></span> Loading realistic patient clinical report & generating insights...</div>');

  try {
    const res = await fetch(`${API_BASE_URL}/reports/samples/${sampleId}`, { method: 'POST' });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || 'Failed to load sample');

    showStatusAlert('success', `<i class="bi bi-magic me-1"></i> Patient Scenario Loaded: <strong>${escapeHtml(result.data.originalName)}</strong>`);
    renderReportDetails(result.data);
    fetchReportsList();
    fetchCohortAnalytics();
    fetchCohortRecords(1);
  } catch (e) {
    showStatusAlert('danger', `Failed to load sample: ${escapeHtml(e.message)}`);
  } finally {
    setLoadingState(false);
  }
};

function renderReportDetails(report) {
  if (!report) return;
  currentReportData = report;

  const summary = report.aiSummary || {};
  const metrics = summary.metrics || [];
  const abnormal = metrics.filter(m => m.flag && m.flag.toLowerCase() !== 'normal');

  document.getElementById('summaryEmptyState').classList.add('d-none');
  document.getElementById('summaryContentArea').classList.remove('d-none');
  document.getElementById('speakReportBtn').classList.remove('d-none');
  document.getElementById('printReportBtn').classList.remove('d-none');

  const summaryStatusBadge = document.getElementById('summaryStatusBadge');
  summaryStatusBadge.className = 'badge bg-success-subtle text-success border border-success-subtle';
  summaryStatusBadge.textContent = 'Analyzed';

  document.getElementById('currentReportTitle').textContent = report.originalName || 'Lab Report';
  document.getElementById('currentReportCategory').textContent = report.category || 'General';

  const dateStr = report.uploadedAt || report.createdAt || new Date().toISOString();
  document.getElementById('currentReportDate').textContent = new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const flagsContainer = document.getElementById('currentReportFlags');
  if (abnormal.length > 0) {
    flagsContainer.innerHTML = `<span class="badge-indicator abnormal"><i class="bi bi-exclamation-circle-fill"></i> ${abnormal.length} Out-of-Range</span>`;
  } else if (metrics.length > 0) {
    flagsContainer.innerHTML = `<span class="badge-indicator normal"><i class="bi bi-check-circle-fill"></i> All Normal</span>`;
  } else {
    flagsContainer.innerHTML = '';
  }

  document.getElementById('summaryOverviewText').textContent = summary.overview || 'No patient summary provided.';

  // Key Findings
  const findingsList = document.getElementById('summaryKeyFindingsList');
  findingsList.innerHTML = '';
  (summary.keyFindings || []).forEach(f => {
    const li = document.createElement('li');
    li.textContent = f;
    findingsList.appendChild(li);
  });

  // Metrics Table
  const tableBody = document.getElementById('metricsTableBody');
  tableBody.innerHTML = '';
  if (metrics.length > 0) {
    metrics.forEach(m => {
      const tr = document.createElement('tr');
      const flag = (m.flag || 'normal').toLowerCase();
      let badgeClass = 'normal';
      let icon = 'bi-check2';
      let label = 'Normal';

      if (flag === 'high') {
        badgeClass = 'high';
        icon = 'bi-arrow-up-circle-fill';
        label = 'High';
      } else if (flag === 'low') {
        badgeClass = 'low';
        icon = 'bi-arrow-down-circle-fill';
        label = 'Low';
      }

      tr.innerHTML = `
        <td class="fw-semibold">${escapeHtml(m.testName)}</td>
        <td><strong>${escapeHtml(m.resultValue)}</strong> <span class="text-muted small">${escapeHtml(m.unit || '')}</span></td>
        <td class="text-muted small">${escapeHtml(m.referenceRange || 'Standard')}</td>
        <td><span class="badge-indicator ${badgeClass}"><i class="bi ${icon}"></i> ${label}</span></td>
      `;
      tableBody.appendChild(tr);
    });
    document.getElementById('statMetricCount').textContent = metrics.length;
  } else {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No structured numerical lab biomarkers detected in this document.</td></tr>';
  }

  // Doctor Questions
  const questionsList = document.getElementById('doctorQuestionsList');
  questionsList.innerHTML = '';
  (summary.doctorQuestions || []).forEach(q => {
    const li = document.createElement('li');
    li.textContent = q;
    questionsList.appendChild(li);
  });

  // Raw text
  document.getElementById('rawExtractedTextViewer').textContent = report.extractedText || 'No raw text stored.';
}

function toggleReadAloudReport(btn) {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    stopSpeaking();
    btn.classList.remove('playing');
    btn.innerHTML = '<i class="bi bi-volume-up-fill fs-6"></i> <span>Listen to Report</span>';
    return;
  }

  if (!currentReportData || !currentReportData.aiSummary) return;

  const summary = currentReportData.aiSummary;
  const scriptText = `Medical report summary for ${currentReportData.originalName}. ${summary.overview}. Key findings: ${(summary.keyFindings || []).join('. ')}. Questions for your doctor: ${(summary.doctorQuestions || []).join('. ')}`;

  btn.classList.add('playing');
  btn.innerHTML = '<i class="bi bi-stop-circle-fill fs-6"></i> <span>Stop Speaking</span>';

  speakText(scriptText, () => {
    btn.classList.remove('playing');
    btn.innerHTML = '<i class="bi bi-volume-up-fill fs-6"></i> <span>Listen to Report</span>';
  });
}

function handleCopyQuestions() {
  if (!currentReportData || !currentReportData.aiSummary || !currentReportData.aiSummary.doctorQuestions) return;
  const questions = currentReportData.aiSummary.doctorQuestions;
  const text = `Questions for My Doctor (${currentReportData.originalName}):\n\n` + questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyQuestionsBtn');
    btn.innerHTML = '<i class="bi bi-check me-1 text-success"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="bi bi-clipboard me-1"></i> Copy'; }, 2000);
  });
}

async function fetchReportsList() {
  try {
    const res = await fetch(`${API_BASE_URL}/reports?limit=15`);
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      cachedReports = result.data;
      renderHistoryList(cachedReports);
      if (!currentReportData && cachedReports.length > 0) {
        window.loadSingleReport(cachedReports[0].id);
      }
    }
  } catch (e) {
    console.warn('Reports fetch error:', e);
  }
}

function renderHistoryList(reports) {
  const container = document.getElementById('historyListContainer');
  if (!container) return;
  if (reports.length === 0) {
    container.innerHTML = '<p class="text-muted small text-center my-3" id="historyEmptyMsg">No past reports saved yet.</p>';
    return;
  }
  container.innerHTML = '';
  reports.slice(0, 10).forEach(r => {
    const item = document.createElement('div');
    item.className = 'history-item px-2 py-2';
    const dateStr = r.uploadedAt || r.createdAt;
    const formatted = dateStr ? new Date(dateStr).toLocaleDateString() : '';
    item.innerHTML = `
      <div class="d-flex align-items-center text-truncate me-2" style="max-width: 65%;">
        <i class="bi bi-file-earmark-medical text-teal me-2 fs-5"></i>
        <div class="text-truncate">
          <div class="fw-semibold text-truncate small">${escapeHtml(r.originalName)}</div>
          <div class="text-muted" style="font-size: 0.72rem;">${escapeHtml(r.category || 'General')} • ${formatted}</div>
        </div>
      </div>
      <div class="d-flex align-items-center gap-1">
        <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.75rem;" onclick="loadSingleReport(${r.id})">View</button>
        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 0.75rem;" onclick="deleteReport(${r.id})"><i class="bi bi-trash"></i></button>
      </div>
    `;
    container.appendChild(item);
  });
}

window.loadSingleReport = async function(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`);
    const result = await res.json();
    if (result.success && result.data) {
      renderReportDetails(result.data);
      showStatusAlert('info', `Viewing report: <strong>${escapeHtml(result.data.originalName)}</strong>`);
    }
  } catch (e) {
    console.error('Failed to load report:', e);
  }
};

window.deleteReport = async function(id) {
  if (!confirm('Are you sure you want to delete this report record?')) return;
  try {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      if (currentReportData && currentReportData.id === id) {
        currentReportData = null;
        document.getElementById('summaryContentArea').classList.add('d-none');
        document.getElementById('summaryEmptyState').classList.remove('d-none');
        document.getElementById('summaryStatusBadge').textContent = 'Awaiting Upload';
        document.getElementById('summaryStatusBadge').className = 'badge bg-secondary-subtle text-secondary';
      }
      fetchReportsList();
      fetchCohortAnalytics();
      fetchCohortRecords(cohortCurrentPage);
    }
  } catch (e) {
    alert('Failed to delete report: ' + e.message);
  }
};

// =========================================================================
// 4. TAB 2: 5,000 PATIENT COHORT ANALYTICS (THE BROCODE)
// =========================================================================
function setupCohortAnalyticsEvents() {
  const refreshBtn = document.getElementById('refreshCohortAnalyticsBtn');
  const searchInput = document.getElementById('cohortSearchInput');
  const categorySelect = document.getElementById('cohortCategorySelect');
  const prevBtn = document.getElementById('cohortPrevPageBtn');
  const nextBtn = document.getElementById('cohortNextPageBtn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchCohortAnalytics();
      fetchCohortRecords(cohortCurrentPage);
    });
  }

  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      cohortSearchQuery = e.target.value.trim();
      searchTimeout = setTimeout(() => {
        cohortCurrentPage = 1;
        fetchCohortRecords(1);
      }, 300);
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      cohortCategoryFilter = e.target.value;
      cohortCurrentPage = 1;
      fetchCohortRecords(1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (cohortCurrentPage > 1) {
        cohortCurrentPage--;
        fetchCohortRecords(cohortCurrentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (cohortCurrentPage < cohortTotalPages) {
        cohortCurrentPage++;
        fetchCohortRecords(cohortCurrentPage);
      }
    });
  }
}

async function fetchCohortAnalytics() {
  try {
    const res = await fetch(`${API_BASE_URL}/cohort/analytics`);
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && result.data) {
      const d = result.data;
      const countFormatted = Number(d.totalPatients).toLocaleString();
      document.getElementById('cohortTotalPatients').textContent = countFormatted;
      document.getElementById('cohortTotalBiomarkers').textContent = Number(d.totalBiomarkers).toLocaleString();
      document.getElementById('cohortAbnormalRate').textContent = `${d.abnormalRatePct}%`;
      document.getElementById('statReportCount').textContent = countFormatted;
    }
  } catch (e) {
    console.warn('Cohort analytics fetch failed:', e);
  }
}

async function fetchCohortRecords(page = 1) {
  const tableBody = document.getElementById('cohortTableBody');
  if (!tableBody) return;

  const url = `${API_BASE_URL}/reports?page=${page}&limit=12&category=${encodeURIComponent(cohortCategoryFilter)}&search=${encodeURIComponent(cohortSearchQuery)}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const result = await res.json();

    if (result.success) {
      cohortCurrentPage = result.page || 1;
      cohortTotalPages = result.totalPages || 1;

      document.getElementById('cohortRecordsTotalCount').textContent = `${Number(result.count).toLocaleString()} records found`;
      document.getElementById('cohortPaginationInfo').textContent = `Page ${cohortCurrentPage} of ${cohortTotalPages}`;

      document.getElementById('cohortPrevPageBtn').disabled = (cohortCurrentPage <= 1);
      document.getElementById('cohortNextPageBtn').disabled = (cohortCurrentPage >= cohortTotalPages);

      if (result.data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No patient records match your search criteria.</td></tr>';
        return;
      }

      tableBody.innerHTML = '';
      result.data.forEach(r => {
        const tr = document.createElement('tr');
        const summary = r.aiSummary || {};
        const metrics = summary.metrics || [];
        const abnormalCount = metrics.filter(m => m.flag && m.flag.toLowerCase() !== 'normal').length;
        const dateStr = r.uploadedAt || r.createdAt || '';
        const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString() : '';

        tr.innerHTML = `
          <td class="text-muted small">#${r.id}</td>
          <td>
            <div class="fw-semibold text-dark small text-truncate" style="max-width: 240px;">${escapeHtml(r.originalName)}</div>
            <div class="text-muted" style="font-size: 0.72rem;">${escapeHtml(r.notes || 'Cohort screening record')}</div>
          </td>
          <td><span class="badge bg-light text-dark border">${escapeHtml(r.category || 'General')}</span></td>
          <td>
            ${abnormalCount > 0 ? 
              `<span class="badge-indicator abnormal py-0 px-2" style="font-size: 0.7rem;"><i class="bi bi-exclamation-triangle"></i> ${abnormalCount} Flagged</span>` : 
              `<span class="badge-indicator normal py-0 px-2" style="font-size: 0.7rem;"><i class="bi bi-check2"></i> Normal</span>`}
          </td>
          <td class="text-muted small">${dateFormatted}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.75rem;" onclick="inspectPatientFromCohort(${r.id})">
              Inspect Report
            </button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
  } catch (e) {
    console.warn('Cohort records fetch failed:', e);
  }
}

window.inspectPatientFromCohort = function(id) {
  // Switch to Tab 1 (Reports)
  document.getElementById('tab-reports-btn').click();
  // Load and render report
  window.loadSingleReport(id);
};

// =========================================================================
// 5. TAB 3: LIVE MEDICINE TRACKER & SCHEDULE
// =========================================================================
function setupMedicationEvents() {
  const chimeToggleBtn = document.getElementById('chimeToggleBtn');
  const chimeStatusText = document.getElementById('chimeStatusText');
  const saveMedicationBtn = document.getElementById('saveMedicationBtn');
  const modalVoiceNameBtn = document.getElementById('modalVoiceNameBtn');

  if (chimeToggleBtn) {
    chimeToggleBtn.addEventListener('click', () => {
      chimeEnabled = !chimeEnabled;
      chimeStatusText.textContent = chimeEnabled ? 'ON' : 'OFF';
      chimeToggleBtn.className = chimeEnabled ? 'btn btn-sm btn-outline-secondary bg-white' : 'btn btn-sm btn-light text-muted';
      if (chimeEnabled) playChimeSound();
    });
  }

  if (modalVoiceNameBtn) {
    modalVoiceNameBtn.addEventListener('click', () => {
      startDictationIntoInput(document.getElementById('modalMedName'), modalVoiceNameBtn);
    });
  }

  if (saveMedicationBtn) {
    saveMedicationBtn.addEventListener('click', handleSaveNewMedication);
  }
}

async function fetchMedicationsList() {
  try {
    const res = await fetch(`${API_BASE_URL}/medications`);
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      cachedMedications = result.data;
      renderMedicationsGrid(cachedMedications);
      evaluateNextDoseTime(new Date());
    }
  } catch (e) {
    console.warn('Medications fetch error:', e);
  }
}

function renderMedicationsGrid(meds) {
  const container = document.getElementById('medicationsListContainer');
  if (!container) return;

  const total = meds.length;
  const taken = meds.filter(m => m.takenToday).length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  document.getElementById('medAdherencePct').textContent = `${taken} of ${total} doses taken (${pct}%)`;
  document.getElementById('medProgressBar').style.width = `${pct}%`;

  if (meds.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-calendar-x fs-1 text-muted"></i>
        <h6 class="mt-2 text-dark fw-bold">No medications scheduled</h6>
        <p class="text-muted small">Click "Add Medication" above to set up daily medicine time-to-time reminders.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  meds.forEach(m => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    const isTaken = m.takenToday;

    col.innerHTML = `
      <div class="med-card h-100 ${isTaken ? 'taken' : ''}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="med-time-pill">
            <i class="bi bi-clock-fill"></i> ${escapeHtml(m.timeOfDay)}
          </span>
          <span class="badge ${isTaken ? 'bg-success' : 'bg-warning text-dark'}">
            ${isTaken ? '<i class="bi bi-check-circle"></i> Taken' : '<i class="bi bi-hourglass"></i> Pending'}
          </span>
        </div>

        <h5 class="fw-bold text-dark mb-1">${escapeHtml(m.name)}</h5>
        <div class="text-primary fw-semibold small mb-2">${escapeHtml(m.dosage)} • ${escapeHtml(m.mealTiming || 'After Food')}</div>
        
        <p class="text-muted small mb-3" style="min-height: 38px;">
          ${escapeHtml(m.notes || 'Take on time with water.')}
        </p>

        <div class="d-flex align-items-center justify-content-between pt-2 border-top">
          <button type="button" class="btn btn-sm btn-link text-primary p-0 text-decoration-none" onclick="speakMedicationInstruction('${escapeHtml(m.name)}', '${escapeHtml(m.dosage)}', '${escapeHtml(m.mealTiming)}', '${escapeHtml(m.timeOfDay)}')">
            <i class="bi bi-volume-up-fill me-1"></i> Listen
          </button>

          <div class="d-flex gap-1">
            ${isTaken ? `
              <button class="btn btn-sm btn-outline-secondary" onclick="toggleMedTaken(${m.id}, false)">
                Undo
              </button>
            ` : `
              <button class="btn btn-sm btn-success fw-bold" onclick="toggleMedTaken(${m.id}, true)">
                <i class="bi bi-check2"></i> Mark Taken
              </button>
            `}
            <button class="btn btn-sm btn-outline-danger" onclick="deleteMedicationItem(${m.id})" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

window.toggleMedTaken = async function(id, take) {
  const endpoint = take ? `${API_BASE_URL}/medications/${id}/take` : `${API_BASE_URL}/medications/${id}/undo`;
  try {
    const res = await fetch(endpoint, { method: 'POST' });
    if (res.ok) {
      if (take && chimeEnabled) playChimeSound();
      fetchMedicationsList();
    }
  } catch (e) {
    console.error('Medication status toggle failed:', e);
  }
};

window.deleteMedicationItem = async function(id) {
  if (!confirm('Remove this medicine from your schedule?')) return;
  try {
    await fetch(`${API_BASE_URL}/medications/${id}`, { method: 'DELETE' });
    fetchMedicationsList();
  } catch (e) {
    console.error('Delete failed:', e);
  }
};

window.speakMedicationInstruction = function(name, dosage, mealTiming, timeOfDay) {
  const text = `Time to take ${name}, dosage is ${dosage}. Schedule is at ${timeOfDay}, ${mealTiming}. Please drink water and follow instructions.`;
  speakText(text);
};

async function handleSaveNewMedication() {
  const name = document.getElementById('modalMedName').value.trim();
  const dosage = document.getElementById('modalMedDosage').value.trim() || '1 tablet';
  const timeOfDay = document.getElementById('modalMedTime').value || '08:30';
  const mealTiming = document.getElementById('modalMedMeal').value;
  const frequency = document.getElementById('modalMedFreq').value;
  const notes = document.getElementById('modalMedNotes').value.trim();

  if (!name) {
    alert('Please enter or speak the medicine name.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dosage, timeOfDay, mealTiming, frequency, notes })
    });
    const result = await res.json();
    if (result.success) {
      const modalEl = document.getElementById('addMedicationModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      document.getElementById('addMedicationForm').reset();
      fetchMedicationsList();
    }
  } catch (e) {
    alert('Failed to save medication: ' + e.message);
  }
}

// =========================================================================
// 6. TAB 4: MEDICINE PHOTO IDENTIFIER
// =========================================================================
function setupMedicineIdentifierEvents() {
  const medPhotoDropzone = document.getElementById('medPhotoDropzone');
  const medPhotoFileInput = document.getElementById('medPhotoFileInput');
  const browseMedPhotoBtn = document.getElementById('browseMedPhotoBtn');
  const clearMedPhotoBtn = document.getElementById('clearMedPhotoBtn');
  const searchMedicineBtn = document.getElementById('searchMedicineBtn');
  const voiceMedSearchBtn = document.getElementById('voiceMedSearchBtn');
  const speakMedInfoBtn = document.getElementById('speakMedInfoBtn');
  const addIdentifiedToTrackerBtn = document.getElementById('addIdentifiedToTrackerBtn');

  browseMedPhotoBtn.addEventListener('click', (e) => { e.stopPropagation(); medPhotoFileInput.click(); });
  medPhotoDropzone.addEventListener('click', () => medPhotoFileInput.click());

  medPhotoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMedPhotoSelected(e.target.files[0]);
    }
  });

  clearMedPhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    medPhotoFileInput.value = '';
    document.getElementById('medPhotoPreviewBox').style.display = 'none';
  });

  searchMedicineBtn.addEventListener('click', () => {
    const query = document.getElementById('medicineNameSearchInput').value.trim();
    if (query) identifyMedicineQuery(query);
  });

  document.getElementById('medicineNameSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = document.getElementById('medicineNameSearchInput').value.trim();
      if (query) identifyMedicineQuery(query);
    }
  });

  if (voiceMedSearchBtn) {
    voiceMedSearchBtn.addEventListener('click', () => {
      startDictationIntoInput(document.getElementById('medicineNameSearchInput'), voiceMedSearchBtn, (recognizedText) => {
        identifyMedicineQuery(recognizedText);
      });
    });
  }

  if (speakMedInfoBtn) {
    speakMedInfoBtn.addEventListener('click', () => {
      if (identifiedMedicineData && identifiedMedicineData.audio_script) {
        speakText(identifiedMedicineData.audio_script);
      }
    });
  }

  if (addIdentifiedToTrackerBtn) {
    addIdentifiedToTrackerBtn.addEventListener('click', () => {
      if (identifiedMedicineData) {
        document.getElementById('modalMedName').value = identifiedMedicineData.generic.split('(')[0].trim();
        document.getElementById('modalMedNotes').value = `Identified: ${identifiedMedicineData.uses}`;
        const modal = new bootstrap.Modal(document.getElementById('addMedicationModal'));
        modal.show();
      }
    });
  }
}

function handleMedPhotoSelected(file) {
  document.getElementById('medPhotoPreviewName').textContent = file.name;
  document.getElementById('medPhotoPreviewBox').style.display = 'block';

  const formData = new FormData();
  formData.append('photo', file);

  const alertBox = document.getElementById('medIdentifyAlert');
  alertBox.className = 'alert alert-info mt-3 small';
  alertBox.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Analyzing medicine packaging and OCR text...';
  alertBox.classList.remove('d-none');

  fetch(`${API_BASE_URL}/medicines/identify`, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(res => {
      if (res.success && res.data) {
        alertBox.className = 'alert alert-success mt-3 small';
        alertBox.innerHTML = `<i class="bi bi-check-circle me-1"></i> Medicine identified from packaging!`;
        renderMedicineInfo(res.data);
      } else {
        throw new Error(res.message || 'Could not identify medicine.');
      }
    })
    .catch(err => {
      alertBox.className = 'alert alert-warning mt-3 small';
      alertBox.textContent = 'Could not read medicine name from image. Please try another angle or type/speak the name.';
    });
}

window.identifyQuickMedicine = function(name) {
  document.getElementById('medicineNameSearchInput').value = name;
  identifyMedicineQuery(name);
};

function identifyMedicineQuery(name) {
  const alertBox = document.getElementById('medIdentifyAlert');
  alertBox.className = 'alert alert-info mt-3 small';
  alertBox.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Looking up clinical details for "${escapeHtml(name)}"...`;
  alertBox.classList.remove('d-none');

  fetch(`${API_BASE_URL}/medicines/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicineName: name })
  })
    .then(r => r.json())
    .then(res => {
      if (res.success && res.data) {
        alertBox.className = 'alert alert-success mt-3 small';
        alertBox.innerHTML = `<i class="bi bi-check-circle me-1"></i> Drug profile loaded.`;
        renderMedicineInfo(res.data);
      }
    })
    .catch(err => {
      alertBox.className = 'alert alert-danger mt-3 small';
      alertBox.textContent = 'Lookup failed: ' + err.message;
    });
}

function renderMedicineInfo(med) {
  identifiedMedicineData = med;
  document.getElementById('medEmptyState').classList.add('d-none');
  document.getElementById('medResultCard').classList.remove('d-none');
  document.getElementById('speakMedInfoBtn').classList.remove('d-none');

  document.getElementById('medGenericName').textContent = med.generic || 'Identified Medicine';
  document.getElementById('medDrugClass').textContent = med.drug_class || 'General Drug';
  document.getElementById('medBrands').textContent = med.brand_examples || 'Standard formulation';
  document.getElementById('medUses').textContent = med.uses || 'Not specified';
  document.getElementById('medHowToTake').textContent = med.how_to_take || 'Follow doctor directions.';
  document.getElementById('medPrecautions').textContent = med.precautions || 'Keep safe.';
  document.getElementById('medSideEffects').textContent = med.side_effects || 'None noted.';

  if (med.audio_script) {
    speakText(med.audio_script);
  }
}

// =========================================================================
// 7. TAB 5: VOICE COPILOT ACCESSIBILITY (SPOKEN AI CONVERSATION)
// =========================================================================
function setupVoiceCopilotEvents() {
  const globalVoiceBtn = document.getElementById('globalVoiceBtn');
  const mainMicBtn = document.getElementById('mainMicBtn');
  const replayVoiceResponseBtn = document.getElementById('replayVoiceResponseBtn');

  if (globalVoiceBtn) {
    globalVoiceBtn.addEventListener('click', () => {
      document.getElementById('tab-voice-btn').click();
      toggleSpeechListening();
    });
  }

  if (mainMicBtn) {
    mainMicBtn.addEventListener('click', toggleSpeechListening);
  }

  if (replayVoiceResponseBtn) {
    replayVoiceResponseBtn.addEventListener('click', () => {
      const text = document.getElementById('copilotVoiceText').textContent;
      if (text) speakText(text);
    });
  }
}

function toggleSpeechListening() {
  if (!speechRecognition) {
    alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return;
  }
  if (isListening) {
    speechRecognition.stop();
  } else {
    try {
      speechRecognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }
}

function updateMicUI(listening) {
  const mainMicBtn = document.getElementById('mainMicBtn');
  const mainMicIcon = document.getElementById('mainMicIcon');
  const mainMicLabel = document.getElementById('mainMicLabel');
  const subtext = document.getElementById('micStatusSubtext');

  if (listening) {
    if (mainMicBtn) mainMicBtn.classList.add('mic-pulse', 'btn-danger');
    if (mainMicIcon) mainMicIcon.className = 'bi bi-soundwave fs-3';
    if (mainMicLabel) mainMicLabel.textContent = 'Listening... Speak Now';
    if (subtext) subtext.textContent = 'Health Copilot is listening to your voice...';
  } else {
    if (mainMicBtn) mainMicBtn.classList.remove('mic-pulse', 'btn-danger');
    if (mainMicIcon) mainMicIcon.className = 'bi bi-mic-fill fs-3';
    if (mainMicLabel) mainMicLabel.textContent = 'Tap to Speak';
    if (subtext) subtext.textContent = 'Click to start listening in English or your language';
  }
}

function startDictationIntoInput(inputEl, btnEl, onDone) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice microphone not supported on this browser.');
    return;
  }
  const recognizer = new SpeechRecognition();
  recognizer.lang = 'en-US';
  recognizer.onstart = () => {
    if (btnEl) btnEl.innerHTML = '<span class="spinner-grow spinner-grow-sm text-danger me-1"></span> Listening...';
  };
  recognizer.onresult = (e) => {
    const text = e.results[0][0].transcript;
    inputEl.value = (inputEl.value ? inputEl.value + ' ' : '') + text;
    if (onDone) onDone(text);
  };
  recognizer.onend = () => {
    if (btnEl) btnEl.innerHTML = '<i class="bi bi-mic-fill me-1"></i> Speak Notes';
  };
  recognizer.start();
}

function handleVoiceTranscript(spokenText) {
  const userBubble = document.getElementById('userVoiceBubble');
  const userText = document.getElementById('userVoiceText');
  const copilotBubble = document.getElementById('copilotVoiceBubble');
  const copilotText = document.getElementById('copilotVoiceText');

  userText.textContent = `"${spokenText}"`;
  userBubble.classList.remove('d-none');

  const lower = spokenText.toLowerCase();
  let responseText = '';

  if (lower.includes('next medicine') || (lower.includes('when') && lower.includes('medicine'))) {
    const pending = cachedMedications.filter(m => !m.takenToday);
    if (pending.length > 0) {
      const next = pending[0];
      responseText = `Your next scheduled medicine is ${next.name}, dosage ${next.dosage}, to take ${next.mealTiming} at ${next.timeOfDay}.`;
    } else {
      responseText = 'You have completed all your scheduled medicines for today. Great job!';
    }
  } else if (lower.includes('dolo') || lower.includes('paracetamol')) {
    responseText = 'Paracetamol, also known as Dolo 650, is for fever and body pain. Take one tablet with water after food. Do not take more than four tablets in twenty-four hours.';
    window.identifyQuickMedicine('Dolo 650');
  } else if (lower.includes('metformin') || lower.includes('sugar') || lower.includes('diabetes')) {
    responseText = 'Metformin is for controlling high blood sugar in Type 2 Diabetes. Always take it with food to avoid an upset stomach.';
    window.identifyQuickMedicine('Metformin');
  } else if (lower.includes('pan 40') || lower.includes('pantoprazole') || lower.includes('gas') || lower.includes('acidity')) {
    responseText = 'Pantoprazole or Pan 40 is an antacid. It cures stomach acidity and heartburn. Take it thirty minutes before breakfast on an empty stomach.';
    window.identifyQuickMedicine('Pan 40');
  } else if (lower.includes('report') || lower.includes('blood test') || lower.includes('lab')) {
    if (currentReportData && currentReportData.aiSummary) {
      responseText = `Here is your report overview: ${currentReportData.aiSummary.overview}`;
    } else {
      responseText = 'You do not have a report loaded yet. Loading the diabetes and lipid patient scenario for you now.';
      window.loadPresetSample('diabetes_lipid');
    }
  } else if (lower.includes('hemoglobin') || lower.includes('anemia') || lower.includes('dizzy')) {
    responseText = 'Low hemoglobin means your red blood cells have less iron to carry oxygen, which can cause fatigue and dizziness. You should eat green leafy vegetables and consult your doctor for iron tests.';
    window.loadPresetSample('anemia_cbc');
  } else {
    responseText = `I heard you ask: "${spokenText}". Health Copilot represented by The Brocode has recorded this in your session notes. Please consult your physician for clinical diagnosis.`;
  }

  copilotText.textContent = responseText;
  copilotBubble.classList.remove('d-none');

  speakText(responseText);
}

window.simulateVoiceQuery = function(question) {
  document.getElementById('tab-voice-btn').click();
  handleVoiceTranscript(question);
};

// =========================================================================
// 8. BACKEND CONNECTIVITY HEALTH CHECK
// =========================================================================
function setupBackendHealthCheck() {
  const btn = document.getElementById('checkBackendBtn');
  const pill = document.getElementById('backendStatusPill');
  if (btn) btn.addEventListener('click', checkBackendHealth);
  if (pill) pill.addEventListener('click', checkBackendHealth);
}

async function checkBackendHealth() {
  const dot = document.getElementById('backendStatusDot');
  const text = document.getElementById('backendStatusText');
  text.textContent = 'Backend: Checking...';
  dot.className = 'status-dot offline';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      dot.className = 'status-dot online';
      text.textContent = `Backend: Online (${data.team || 'The Brocode'})`;
      return true;
    }
  } catch (e) {
    dot.className = 'status-dot offline';
    text.textContent = 'Backend: Offline';
  }
  return false;
}

// Helpers
function setLoadingState(isLoading, text = 'Analyzing Report...') {
  const btn = document.getElementById('analyzeReportBtn');
  const spinner = document.getElementById('btnSpinner');
  const icon = document.getElementById('btnIcon');
  const label = document.getElementById('btnText');

  if (isLoading) {
    btn.disabled = true;
    spinner.classList.remove('d-none');
    icon.classList.add('d-none');
    label.textContent = text;
  } else {
    btn.disabled = false;
    spinner.classList.add('d-none');
    icon.classList.remove('d-none');
    label.textContent = 'Upload & Analyze Report';
  }
}

function showStatusAlert(type, html) {
  const alertEl = document.getElementById('uploadStatusAlert');
  alertEl.className = `alert alert-${type} mt-3 mb-0 small`;
  alertEl.innerHTML = html;
  alertEl.classList.remove('d-none');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
