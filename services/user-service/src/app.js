const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const { createLogger } = require('../../../shared/logger');
const { SERVICES, HTTP_STATUS } = require('../../../shared/constants');

const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const logger = createLogger(SERVICES.USER_SERVICE);
const app = express();

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  req.logger = logger.child({ requestId: req.requestId });
  next();
});

// Security middleware
app.use(helmet());
app.use(cors());

// Request logging
app.use(morgan(':method :url :status :response-time ms', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/users', userRoutes);
app.use('/users', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
