require('dotenv').config();
const app = require('./app');
const { createLogger } = require('../../../shared/logger');
const { createDatabaseConnection } = require('../../../shared/config/database');
const { SERVICES } = require('../../../shared/constants');
const seedDatabase = require('./seeds');

const logger = createLogger(SERVICES.ORDER_SERVICE);
const PORT = process.env.PORT || 3003;

const { connectWithRetry, syncDatabase } = createDatabaseConnection(SERVICES.ORDER_SERVICE);

const startServer = async () => {
  try {
    await connectWithRetry();
    await syncDatabase();

    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      logger.info(`Order Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', { error: err.message });
          process.exit(1);
        }
        logger.info('Server closed. Process terminating...');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

startServer();
