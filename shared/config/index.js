const loadConfig = (serviceName) => {
  return {
    serviceName,
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      name: process.env.DB_NAME,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
      poolMin: parseInt(process.env.DB_POOL_MIN) || 0
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    // Redis (optional for chat service)
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || ''
    },

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100
    },

    // Service URLs
    services: {
      userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
      productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
      orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
      paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
      chatService: process.env.CHAT_SERVICE_URL || 'http://localhost:3005'
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info'
    }
  };
};

module.exports = { loadConfig };
