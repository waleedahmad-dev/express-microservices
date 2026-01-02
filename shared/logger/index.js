const winston = require('winston');
const path = require('path');

const createLogger = (serviceName) => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      const reqId = requestId ? `[${requestId}]` : '';
      return `${timestamp} [${serviceName}] ${reqId} ${level.toUpperCase()}: ${message} ${metaString}`;
    })
  );

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5
      })
    ]
  });

  // Create child logger with request context
  logger.child = (meta) => {
    return {
      info: (message, additionalMeta = {}) => logger.info(message, { ...meta, ...additionalMeta }),
      warn: (message, additionalMeta = {}) => logger.warn(message, { ...meta, ...additionalMeta }),
      error: (message, additionalMeta = {}) => logger.error(message, { ...meta, ...additionalMeta }),
      debug: (message, additionalMeta = {}) => logger.debug(message, { ...meta, ...additionalMeta })
    };
  };

  return logger;
};

module.exports = { createLogger };
