import User from '../models/User.js';
import Cart from '../models/Cart.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  // 1. Check if email already registered
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return next(
      new AppError(
        'An account with this email address already exists. Please sign in or use another email.',
        409
      )
    );
  }

  // 2. Security: Never allow public registration to set role. Force 'customer' role.
  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    phone: phone || '',
    role: 'customer',
  });

  // 3. Automatically initialize an empty shopping cart for the new customer
  try {
    await Cart.create({
      user: user._id,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      total: 0,
    });
  } catch (cartErr) {
    // If cart creation errors, log warning but don't fail user creation
    console.warn('Initial cart setup note:', cartErr.message);
  }

  // 4. Generate JWT token
  const token = generateToken(user._id, user.role);

  // 5. Send success response (password is automatically stripped by User schema toJSON)
  sendSuccess(res, 201, 'Account registered successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Verify user exists & explicitly select password hash
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password credentials', 401));
  }

  // 2. Verify password match using bcrypt
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password credentials', 401));
  }

  // 3. Verify account is active
  if (!user.isActive) {
    return next(
      new AppError(
        'This account has been deactivated. Please contact support.',
        403
      )
    );
  }

  // 4. Issue JWT token
  const token = generateToken(user._id, user.role);

  // 5. Send success response
  sendSuccess(res, 200, 'Logged in successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated users)
 */
export const getMe = asyncHandler(async (req, res, next) => {
  // req.user is attached by protect middleware
  sendSuccess(res, 200, 'User profile retrieved successfully', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * @desc    Diagnostic check for admin authorization
 * @route   GET /api/auth/admin-check
 * @access  Private (Admin role only)
 */
export const checkAdminAccess = asyncHandler(async (req, res, next) => {
  sendSuccess(res, 200, 'Admin authorization verified successfully', {
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

export default {
  register,
  login,
  getMe,
  checkAdminAccess,
};
