/**
 * Standard HTTP response format utilities
 */

export const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendFailure = (res, statusCode, message, error = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
