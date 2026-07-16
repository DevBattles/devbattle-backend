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

/**
 * Middleware to authorize users based on their role
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: User not authenticated');
      return next(new AppError('Unauthorized: User not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed: User does not have required role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      return next(new AppError('Forbidden: You do not have permission to access this resource', 403));
    }

    next();
  };
};

/**
 * Middleware to check if user is a student
 */
export const requireStudent = authorizeRoles('student');

/**
 * Middleware to check if user is a teacher
 */
export const requireTeacher = authorizeRoles('teacher');

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = authorizeRoles('admin');

/**
 * Middleware to check if user is a teacher or admin
 */
export const requireTeacherOrAdmin = authorizeRoles('teacher', 'admin');
