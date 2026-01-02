const productRepository = require('../repositories/product.repository');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, EVENTS, HTTP_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.PRODUCT_SERVICE);

class ProductService {
  async createProduct(productData) {
    const existingProduct = await productRepository.findBySku(productData.sku);
    if (existingProduct) {
      const error = new Error('Product with this SKU already exists');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const product = await productRepository.create(productData);

    logger.info('Event emitted', {
      event: EVENTS.PRODUCT_CREATED,
      payload: { productId: product.id, sku: product.sku }
    });

    return product;
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return product;
  }

  async getProductBySku(sku) {
    const product = await productRepository.findBySku(sku);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return product;
  }

  async getAllProducts(options) {
    return productRepository.findAll(options);
  }

  async updateProduct(id, updateData) {
    if (updateData.sku) {
      const existingProduct = await productRepository.findBySku(updateData.sku);
      if (existingProduct && existingProduct.id !== id) {
        const error = new Error('Product with this SKU already exists');
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }
    }

    const product = await productRepository.update(id, updateData);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    logger.info('Event emitted', {
      event: EVENTS.PRODUCT_UPDATED,
      payload: { productId: product.id }
    });

    return product;
  }

  async deleteProduct(id) {
    const deleted = await productRepository.delete(id);
    if (!deleted) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    logger.info('Event emitted', {
      event: EVENTS.PRODUCT_DELETED,
      payload: { productId: id }
    });

    return true;
  }

  async updateInventory(id, quantity) {
    const product = await productRepository.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    await productRepository.updateQuantity(id, quantity);

    logger.info('Event emitted', {
      event: EVENTS.INVENTORY_UPDATED,
      payload: { productId: id, quantity }
    });

    return productRepository.findById(id);
  }

  async reserveInventory(items) {
    const results = [];

    for (const item of items) {
      const product = await productRepository.decrementQuantity(item.productId, item.quantity);
      if (!product) {
        // Rollback previous reservations
        for (const reserved of results) {
          await productRepository.incrementQuantity(reserved.productId, reserved.quantity);
        }
        const error = new Error(`Insufficient stock for product ${item.productId}`);
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
      results.push({ productId: item.productId, quantity: item.quantity });
    }

    logger.info('Inventory reserved', { items });
    return results;
  }

  async releaseInventory(items) {
    for (const item of items) {
      await productRepository.incrementQuantity(item.productId, item.quantity);
    }

    logger.info('Inventory released', { items });
  }

  async checkAvailability(items) {
    const productIds = items.map(item => item.productId);
    const products = await productRepository.checkAvailability(productIds);

    const availability = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        requestedQuantity: item.quantity,
        available: product ? product.quantity >= item.quantity : false,
        currentStock: product?.quantity || 0,
        price: product?.price || 0,
        name: product?.name || 'Unknown'
      };
    });

    return availability;
  }
}

module.exports = new ProductService();
