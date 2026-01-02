const { Sequelize } = require('sequelize');
const { createLogger } = require('../logger');

const createDatabaseConnection = (serviceName) => {
  const logger = createLogger(serviceName);

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: (msg) => logger.debug(msg),
      pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 0,
        acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
        idle: parseInt(process.env.DB_POOL_IDLE) || 10000
      },
      dialectOptions: {
        connectTimeout: 60000
      },
      retry: {
        max: 5
      }
    }
  );

  const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully');
        return true;
      } catch (error) {
        logger.warn(`Database connection attempt ${i + 1}/${retries} failed: ${error.message}`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw new Error('Failed to connect to database after multiple retries');
  };

  const syncDatabase = async (force = false) => {
    try {
      await sequelize.sync({ force, alter: !force });
      logger.info('Database synchronized successfully');
    } catch (error) {
      logger.error('Database synchronization failed', { error: error.message });
      throw error;
    }
  };

  return {
    sequelize,
    connectWithRetry,
    syncDatabase
  };
};

module.exports = { createDatabaseConnection };
