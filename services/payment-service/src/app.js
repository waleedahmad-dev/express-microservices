const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const { createLogger } = require('../../../shared/logger');
const { SERVICES, HTTP_STATUS } = require('../../../shared/constants');

const paymentRoutes = require('./routes/payment.routes');
const healthRoutes = require('./routes/health.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const logger = createLogger(SERVICES.PAYMENT_SERVICE);
const app = express();

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  req.logger = logger.child({ requestId: req.requestId });
  next();
});

app.use(helmet());
app.use(cors());
app.use(morgan(':method :url :status :response-time ms', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRoutes);
app.use('/payments', paymentRoutes);

app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorMiddleware);

module.exports = app;
