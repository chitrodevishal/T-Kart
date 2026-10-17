/**
 * Standardized API Response Helper Functions
 * Ensures all endpoints in T-Kart follow a strict, predictable JSON structure
 */

export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  };

  return res.status(statusCode).json(response);
};

export default {
  sendSuccess,
  sendError
};
