const logger = require('../utils/logger');

/**
 * Global error handling middleware - catches all errors and returns appropriate responses
 */
const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Server error';
  let errors = null;

  // MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (error.code === 11000) {
    statusCode = 400;
    message = 'This data already exists';
    const field = Object.keys(error.keyValue)[0];
    errors = [{
      field,
      message: `${field} is already in use`
    }];
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Rate limiting error
  if (error.status === 429) {
    statusCode = 429;
    message = 'Too many requests. Please try again later.';
  }

  // Log the error
  logger.error(`Error ${statusCode}: ${message}`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Show stack trace in development
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`This route was not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Middleware to wrap async functions - avoids repetitive try-catch
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};