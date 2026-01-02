const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const { createLogger } = require('../../../shared/logger');
const { SERVICES } = require('../../../shared/constants');

const router = express.Router();
const logger = createLogger(SERVICES.API_GATEWAY);

// Service URLs from environment
const serviceUrls = {
  users: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  products: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  orders: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
  chat: process.env.CHAT_SERVICE_URL || 'http://chat-service:3005'
};

// Create axios instance with defaults
const createServiceClient = (baseURL) => {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// Generic proxy handler
const proxyToService = (serviceName, serviceUrl) => {
  return async (req, res, next) => {
    const client = createServiceClient(serviceUrl);

    try {
      // Forward request headers
      const headers = {
        'x-request-id': req.requestId,
        'x-user-id': req.headers['x-user-id'],
        'x-user-role': req.headers['x-user-role'],
        'content-type': req.headers['content-type'] || 'application/json'
      };

      // Build the path (remove the service prefix)
      const path = req.path.replace(new RegExp(`^/${serviceName}`), '') || '/';

      req.logger?.info(`Proxying request to ${serviceName}`, {
        method: req.method,
        path,
        targetUrl: `${serviceUrl}${path}`
      });

      const response = await client({
        method: req.method,
        url: path,
        data: req.body,
        params: req.query,
        headers
      });

      // Forward response headers
      if (response.headers['x-total-count']) {
        res.setHeader('X-Total-Count', response.headers['x-total-count']);
      }

      res.status(response.status).json(response.data);
    } catch (error) {
      next(error);
    }
  };
};

// Route to User Service
router.all('/users*', proxyToService('users', serviceUrls.users));

// Route to Product Service
router.all('/products*', proxyToService('products', serviceUrls.products));

// Route to Order Service
router.all('/orders*', proxyToService('orders', serviceUrls.orders));

// Route to Payment Service
router.all('/payments*', proxyToService('payments', serviceUrls.payments));

// Route to Chat Service (REST endpoints)
router.all('/chat*', proxyToService('chat', serviceUrls.chat));

module.exports = router;
