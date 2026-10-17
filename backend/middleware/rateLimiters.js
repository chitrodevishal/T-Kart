import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter for regular traffic
 * Limits each IP to 200 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  // Keep the lightweight health check available even when normal API traffic is throttled.
  skip: (req) => req.path === '/health',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Sensitive auth rate limiter (for login, register, password resets)
 * Prevents brute-force dictionary attacks and registration spam
 * Limits each IP to 15 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 50 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
});

export default {
  apiLimiter,
  authLimiter,
};
