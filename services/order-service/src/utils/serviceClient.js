const axios = require('axios');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.ORDER_SERVICE);

class ServiceClient {
  constructor(baseURL, serviceName) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.serviceName = serviceName;

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Request to ${this.serviceName}`, {
          method: config.method,
          url: config.url
        });
        return config;
      },
      (error) => {
        logger.error(`Request error to ${this.serviceName}`, { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`Response error from ${this.serviceName}`, {
          error: error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  setRequestId(requestId) {
    this.client.defaults.headers['x-request-id'] = requestId;
    return this;
  }

  setUserId(userId) {
    this.client.defaults.headers['x-user-id'] = userId;
    return this;
  }

  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

// Service clients
const productServiceClient = new ServiceClient(
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  'product-service'
);

const paymentServiceClient = new ServiceClient(
  process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
  'payment-service'
);

module.exports = {
  ServiceClient,
  productServiceClient,
  paymentServiceClient
};
