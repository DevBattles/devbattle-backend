import { verifyToken } from '../auth/jwt.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';

/**
 * Middleware to authenticate requests via Bearer JWT token
 */
export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: Missing or invalid authorization header');
    return next(new AppError('Unauthorized: Access token is missing or invalid', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn('Authentication failed: Token is invalid or has expired');
    return next(new AppError('Unauthorized: Access token is missing or invalid', 401));
  }

  // Attach user details to request object
  req.user = decoded;
  next();
};
