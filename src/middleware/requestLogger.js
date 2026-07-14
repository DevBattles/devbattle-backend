import logger from '../logger/logger.js';

/**
 * Middleware to log HTTP request metadata
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Read request IP
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Wait for the response to finish sending
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user ? req.user.id : 'anonymous';
    
    const logDetails = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTimeMs: duration,
      ipAddress: ip,
      timestamp: new Date().toISOString(),
      userId,
    };

    // Log the request info
    logger.info(
      `HTTP Request: ${req.method} ${req.originalUrl || req.url} - Status ${res.statusCode} in ${duration}ms`,
      logDetails
    );
  });

  next();
};
