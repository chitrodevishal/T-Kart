import jwt from 'jsonwebtoken';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
};

/**
 * Generate a signed JSON Web Token (JWT)
 * @param {string} userId - MongoDB User ObjectId
 * @param {string} role - User role ('customer' or 'admin')
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId, role = 'customer') => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: userId,
      role,
    },
    getJwtSecret(),
    {
      expiresIn,
    }
  );
};

/**
 * Verify and decode a JSON Web Token
 * @param {string} token - JWT string to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export default {
  getJwtSecret,
  generateToken,
  verifyToken,
};
