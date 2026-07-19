/**
 * Standard HTTP response format utilities
 */

export const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
    meta,
  });
};

export const sendFailure = (res, statusCode, message, errors = null, meta = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
    meta,
  });
};
