/**
 * Health Copilot - Main Backend Server
 * 
 * Express server providing:
 * - Health check endpoint: GET /api/health
 * - Reports routes: /api/reports (Upload, AI Summaries, Query, Demo, Delete)
 * - Static file serving for uploads and frontend
 * - CORS configuration for local frontend communication
 */

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (err) {
  console.log('[Info] dotenv not loaded, using default environment settings');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./db/database');
const reportsRouter = require('./routes/reports');

// Initialize database
const dbStatus = initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve frontend statically as well so browsing http://localhost:5000 opens the dashboard!
const frontendDir = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
}

/**
 * Health Check Endpoint: GET /api/health
 * Used by frontend and monitoring to verify backend availability.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Health Copilot API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      reportsApi: 'ready',
      textExtraction: 'ready',
      aiSummaries: 'ready',
      database: dbStatus && dbStatus.status ? dbStatus.status : 'active'
    }
  });
});

/**
 * Mount Routes
 */
app.use('/api/reports', reportsRouter);

/**
 * Root Welcome Route: GET /
 */
app.get('/', (req, res) => {
  const indexPath = path.join(frontendDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).json({
    message: 'Welcome to Health Copilot API service',
    healthCheck: '/api/health',
    reportsEndpoint: '/api/reports',
    documentation: 'See /docs in repository'
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Health Copilot Backend is running on port ${PORT}`);
    console.log(`👉 Web Dashboard: http://localhost:${PORT}`);
    console.log(`👉 Health Check:   http://localhost:${PORT}/api/health`);
    console.log(`👉 Reports API:    http://localhost:${PORT}/api/reports`);
    console.log(`===============================================`);
  });
}

module.exports = app;
