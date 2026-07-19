import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import logger from '../logger/logger.js';

/**
 * Generate a JWT token for a user
 * @param {object} user - User object containing id, username, email, and role
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    logger.debug('JWT verification successful', { userId: decoded.id, role: decoded.role });
    return decoded;
  } catch (error) {
    logger.warn('JWT verification failed', { error: error.message });
    return null;
  }
};
