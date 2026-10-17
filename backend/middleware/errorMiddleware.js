import AppError from '../utils/appError.js';

/**
 * Handle Mongoose invalid ObjectId errors (CastError)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB Duplicate Field Key errors (Code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : 'unknown';
  const message = `Duplicate value for '${field}': "${value}". Please use another value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose Schema Validation errors (ValidationError)
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle invalid JWT token error
 */
const handleJWTError = () =>
  new AppError('Invalid authentication token. Please log in again.', 401);

/**
 * Handle expired JWT token error
 */
const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

/**
 * Send detailed error in development environment
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Send sanitized, professional error in production environment
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    // 2) Programming or other unknown error: don't leak details to client
    console.error('CRITICAL UNEXPECTED ERROR 💥:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong on the server. Please try again later.',
    });
  }
};

/**
 * 404 Catch-All Middleware for undefined endpoints
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on T-Kart server`, 404));
};

/**
 * Centralized Global Error Handling Middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default {
  notFoundHandler,
  globalErrorHandler,
};
