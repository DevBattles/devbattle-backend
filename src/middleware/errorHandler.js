import { ZodError } from 'zod';
import logger from '../logger/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorData = {};

  // Check for Zod schema validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorData = err.errors.reduce((acc, current) => {
      const field = current.path.join('.');
      acc[field] = current.message;
      return acc;
    }, {});
    
    logger.warn('Validation errors encountered', { errors: errorData });
  } else if (err.isOperational) {
    // Known application operational errors
    errorData = { details: err.message };
    logger.warn('Operational error', { message: err.message, statusCode });
  } else {
    // Unexpected database or runtime exceptions
    logger.error('Unexpected exception occurred', {
      message: err.message,
      stack: err.stack,
    });
    
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred on the server';
    } else {
      errorData = {
        details: err.message,
        stack: err.stack,
      };
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: errorData,
  });
};
