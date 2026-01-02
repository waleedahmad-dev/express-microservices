const express = require('express');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES, HTTP_STATUS } = require('../../../../shared/constants');
const { getConnectedUsers } = require('../socket');

const router = express.Router();
const { sequelize } = createDatabaseConnection(SERVICES.CHAT_SERVICE);

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();

    const connectedUsers = getConnectedUsers();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      service: SERVICES.CHAT_SERVICE,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      websocket: {
        connectedUsers: connectedUsers.size
      }
    });
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      service: SERVICES.CHAT_SERVICE,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
