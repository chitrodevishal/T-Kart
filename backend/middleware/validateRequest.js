import { validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

/**
 * Middleware to check express-validator validation results
 * Returns 400 Bad Request with formatted error details if validation fails
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed for request data',
      errors: formattedErrors,
    });
  }

  next();
};

export default validateRequest;
