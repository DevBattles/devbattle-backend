import { checkDbConnection } from '../db/index.js';
import logger from '../logger/logger.js';

export const healthController = {
  /**
   * Performs a system health check, validating the database connection
   */
  async checkHealth(req, res, next) {
    try {
      await checkDbConnection();
      
      return res.status(200).json({
        success: true,
        status: 'OK',
        uptime: `${process.uptime().toFixed(2)}s`,
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Health check failed: database not reachable', { error: error.message });
      
      return res.status(503).json({
        success: false,
        status: 'ERROR',
        uptime: `${process.uptime().toFixed(2)}s`,
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }
};
