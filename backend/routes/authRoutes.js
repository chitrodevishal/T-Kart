import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  checkAdminAccess,
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

/**
 * Validation rules for registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters long'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must contain between 10 and 15 digits'),
  validateRequest,
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest,
];

// Public Authentication Endpoints
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);

// Protected Customer/User Profile Endpoint
router.get('/me', protect, getMe);

// Protected Admin Role Verification Endpoint (for QA & testing access control)
router.get('/admin-check', protect, adminOnly, checkAdminAccess);

export default router;
