const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: false }));

// HTTP request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Root info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'FitTrack AI API',
    version: '1.0.0',
    status: 'running',
    description: 'AI-powered fitness tracking platform',
    documentation: 'See postman/FitTrack_AI.postman_collection.json for all endpoints',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FitTrack AI API is running',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: 'MongoDB',
  });
});

// Mount all API routes under /api
app.use('/api', apiRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

// 404 handler for unmatched routes
app.use((req, res, next) => {
  const error = new Error(`Endpoint not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
