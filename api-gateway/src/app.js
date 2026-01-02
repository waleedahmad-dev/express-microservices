const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const { createLogger } = require('../../shared/logger');
const { SERVICES, HTTP_STATUS } = require('../../shared/constants');

const authMiddleware = require('./middlewares/auth.middleware');
const rateLimitMiddleware = require('./middlewares/rateLimit.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const proxyRoutes = require('./routes/proxy.routes');
const healthRoutes = require('./routes/health.routes');

const logger = createLogger(SERVICES.API_GATEWAY);
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  req.logger = logger.child({ requestId: req.requestId });
  next();
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true
}));

// Request logging
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimitMiddleware);

// Health check (no auth required)
app.use('/health', healthRoutes);

// Authentication for all other routes
app.use('/api', authMiddleware.authenticate);

// Proxy routes to microservices
app.use('/api', proxyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
