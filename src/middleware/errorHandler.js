/**
 * Centralized error handling middleware.
 * Must be the last middleware registered in app.js.
 * Translates Mongoose and application errors into consistent API responses.
 */
const errorHandler = (err, req, res, next) => {
  // Use the error's own statusCode; fall back to the response code unless it is the
  // Express default of 200 (which means no status was explicitly set), in which case use 500.
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Log the full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${err.name || 'Error'}: ${message}`);
  }

  // Mongoose: Bad ObjectId (e.g. /api/workouts/not-an-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: "${err.value}"`;
  }

  // Mongoose: Duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value: a record with this ${field} already exists`;
  }

  // Mongoose: Validation errors (schema-level)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join('; ');
  }

  // JWT errors are handled in authMiddleware; catch any stragglers here
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized — invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized — token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
