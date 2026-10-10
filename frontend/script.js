/**
 * Health Copilot — Frontend Interactions Script
 * 
 * Responsibilities:
 * 1. Handle file drag-and-drop and manual file selection.
 * 2. Display file metadata (name, size) with removal option.
 * 3. Validate user selections.
 * 4. Ping backend GET /api/health to check server connectivity without faking results.
 * 5. Provide honest status feedback for hackathon sprint milestones.
 */

const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const dropzoneContainer = document.getElementById('dropzoneContainer');
const reportFileInput = document.getElementById('reportFileInput');
const browseFileBtn = document.getElementById('browseFileBtn');
const selectedFileBox = document.getElementById('selectedFileBox');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');
const clearFileBtn = document.getElementById('clearFileBtn');
const analyzeReportBtn = document.getElementById('analyzeReportBtn');
const uploadStatusAlert = document.getElementById('uploadStatusAlert');

const backendStatusDot = document.getElementById('backendStatusDot');
const backendStatusText = document.getElementById('backendStatusText');
const checkBackendBtn = document.getElementById('checkBackendBtn');

// State
let currentSelectedFile = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupFileEvents();
  setupFormEvents();
  setupBackendHealthCheck();
  
  // Initial API health check
  checkBackendHealth();
});

/**
 * Configure file selection, browse trigger, and drag-and-drop interactions
 */
function setupFileEvents() {
  // Trigger file dialog on browse button click or dropzone click
  browseFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    reportFileInput.click();
  });

  dropzoneContainer.addEventListener('click', () => {
    reportFileInput.click();
  });

  // Handle file input change
  reportFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneContainer.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneContainer.classList.remove('drag-active');
    });
  });

  dropzoneContainer.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });

  // Clear selected file
  clearFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileSelection();
  });
}

/**
 * Validates and displays selected file information
 * @param {File} file
 */
function handleFileSelection(file) {
  // Supported file formats
  const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
  const fileExt = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExt)) {
    showStatusAlert('danger', `Unsupported file type (.${fileExt}). Please upload a PDF, PNG, or JPG document.`);
    resetFileSelection();
    return;
  }

  // File size limit: 10MB
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    showStatusAlert('danger', 'File size exceeds 10MB limit. Please upload a smaller file.');
    resetFileSelection();
    return;
  }

  currentSelectedFile = file;
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = formatBytes(file.size);
  selectedFileBox.style.display = 'block';

  // Informative status update
  showStatusAlert(
    'info',
    `File ready: <strong>${file.name}</strong> (${formatBytes(file.size)}). Click "Analyze Report" to test workflow.`
  );
}

/**
 * Resets file selection state
 */
function resetFileSelection() {
  currentSelectedFile = null;
  reportFileInput.value = '';
  selectedFileBox.style.display = 'none';
  selectedFileName.textContent = '';
  selectedFileSize.textContent = '';
  uploadStatusAlert.classList.add('d-none');
}

/**
 * Configure analyze button action
 */
function setupFormEvents() {
  analyzeReportBtn.addEventListener('click', () => {
    if (!currentSelectedFile) {
      showStatusAlert('warning', 'Please select a health report file (PDF or image) first.');
      return;
    }

    // Honest status reporting - no fake successful uploads
    showStatusAlert(
      'primary',
      `<strong>File staged:</strong> "${currentSelectedFile.name}".<br>` +
      `The backend upload endpoint (<code>POST /api/reports/upload</code>) is awaiting Multer & extraction pipeline integration in Sprint 2. No data was sent.`
    );
  });
}

/**
 * Checks connectivity with the Express backend GET /api/health
 */
function setupBackendHealthCheck() {
  checkBackendBtn.addEventListener('click', () => {
    checkBackendHealth();
  });
}

async function checkBackendHealth() {
  backendStatusText.textContent = 'Checking...';
  backendStatusDot.className = 'status-dot offline';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      backendStatusDot.className = 'status-dot online';
      backendStatusText.textContent = `Backend: Online (${data.environment || 'dev'})`;
      console.log('[Health Check Success]', data);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    backendStatusDot.className = 'status-dot offline';
    backendStatusText.textContent = 'Backend: Offline';
    console.log('[Health Check Notice] Backend not reachable at http://localhost:5000. Start backend with `npm start` in the backend folder.');
  }
}

/**
 * Helper to display bootstrap alerts in the upload section
 * @param {'info'|'warning'|'danger'|'success'|'primary'} type
 * @param {string} htmlMessage
 */
function showStatusAlert(type, htmlMessage) {
  uploadStatusAlert.className = `alert alert-${type} mt-3 mb-0 small`;
  uploadStatusAlert.innerHTML = htmlMessage;
  uploadStatusAlert.classList.remove('d-none');
}

/**
 * Helper to format byte counts into human-readable strings
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
