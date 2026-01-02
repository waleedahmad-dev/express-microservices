const { HTTP_STATUS, ERROR_MESSAGES } = require('../../../shared/constants');

const errorMiddleware = (err, req, res, next) => {
  req.logger?.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Axios error from downstream service
  if (err.isAxiosError) {
    const status = err.response?.status || HTTP_STATUS.SERVICE_UNAVAILABLE;
    const message = err.response?.data?.message || ERROR_MESSAGES.SERVICE_UNAVAILABLE;

    return res.status(status).json({
      success: false,
      message,
      error: err.response?.data?.error || 'Downstream service error'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
      error: 'Invalid token'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: err.errors
    });
  }

  // Default error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? ERROR_MESSAGES.INTERNAL_ERROR : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
