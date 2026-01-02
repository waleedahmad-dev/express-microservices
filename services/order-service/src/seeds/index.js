const { createLogger } = require('../../../../shared/logger');
const { SERVICES } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.ORDER_SERVICE);

// Order service doesn't need seed data by default
// Orders are created through the API
const seedDatabase = async () => {
  logger.info('Order service seed check completed (no seed data required)');
};

module.exports = seedDatabase;
