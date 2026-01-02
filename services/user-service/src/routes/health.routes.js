const express = require('express');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES, HTTP_STATUS } = require('../../../../shared/constants');

const router = express.Router();
const { sequelize } = createDatabaseConnection(SERVICES.USER_SERVICE);

router.get('/', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      service: SERVICES.USER_SERVICE,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      service: SERVICES.USER_SERVICE,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
