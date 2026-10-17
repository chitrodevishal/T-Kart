import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Protect Middleware: Verifies JWT token and attaches authenticated user to req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please provide an authentication token to gain access.',
        401
      )
    );
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token. Please log in again.', 401));
  }

  // 3. Check if user still exists in database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4. Check if user account is active
  if (!currentUser.isActive) {
    return next(
      new AppError(
        'This user account has been deactivated. Please contact support.',
        403
      )
    );
  }

  // 5. Grant access: attach authenticated user document to request
  req.user = currentUser;
  next();
});

/** Authenticate public catalog requests when a bearer token is supplied. */
export const optionalProtect = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return protect(req, res, next);
};

/**
 * RestrictTo Middleware: Enforces role-based access control (RBAC)
 * @param  {...string} roles - Permitted roles (e.g. 'admin')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action. Administrator privileges required.',
          403
        )
      );
    }
    next();
  };
};

/**
 * Convenience helper middleware for admin-only endpoints
 */
export const adminOnly = restrictTo('admin');

export default {
  protect,
  optionalProtect,
  restrictTo,
  adminOnly,
};
