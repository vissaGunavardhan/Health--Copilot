/**
 * Health Copilot - Main Backend Server
 * 
 * Minimal Express server providing:
 * - Health check endpoint: GET /api/health
 * - Reports routes: /api/reports
 * - CORS configuration for local frontend communication
 */

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (err) {
  // Graceful fallback if dotenv is not yet installed
  console.log('[Info] dotenv not loaded, using default environment settings');
}

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (placeholder for local dev)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      reportsApi: 'placeholder',
      textExtraction: 'pending-sprint-3',
      aiSummaries: 'pending-sprint-4',
      database: 'pending-sprint-2'
    }
  });
});

/**
 * Root Welcome Route: GET /
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Health Copilot API service',
    healthCheck: '/api/health',
    reportsEndpoint: '/api/reports',
    documentation: 'See /docs in repository'
  });
});

// Mount Routes
app.use('/api/reports', reportsRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Health Copilot Backend is running on port ${PORT}`);
  console.log(`👉 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Reports API:  http://localhost:${PORT}/api/reports`);
  console.log(`===============================================`);
});

module.exports = app;
