import app from './app.js';
import { env } from './config/env.js';
import { checkDbConnection } from './db/index.js';
import logger from './logger/logger.js';

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info('Initializing application startup...');

    // Verify database connectivity before starting the Express server
    await checkDbConnection();

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`Server startup: DevBattle Auth Service running on port ${PORT} [Mode: ${env.NODE_ENV}]`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}: initiating graceful server shutdown.`);
      
      server.close(() => {
        logger.info('HTTP server closed. DevBattle Auth Service offline.');
        process.exit(0);
      });

      // Force terminate if connection drain takes too long
      setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Application startup aborted due to critical error', { error: error.message });
    process.exit(1);
  }
};

startServer();
export default app; // For testing or clustering purposes
