const orderRepository = require('../repositories/order.repository');
const sagaService = require('./saga.service');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, HTTP_STATUS, ORDER_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.ORDER_SERVICE);

class OrderService {
  async createOrder(orderData, items, userId, requestId) {
    // Prepare order items with calculated prices
    const orderItems = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = orderData.shippingCost || 0;
    const discount = orderData.discount || 0;
    const total = subtotal + tax + shippingCost - discount;

    const fullOrderData = {
      ...orderData,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      currency: orderData.currency || 'USD'
    };

    // Use saga for order creation
    return sagaService.createOrder(fullOrderData, orderItems, userId, requestId);
  }

  async getOrderById(id, userId = null) {
    const order = await orderRepository.findById(id);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // If userId is provided, check ownership
    if (userId && order.userId !== userId) {
      const error = new Error('Unauthorized to view this order');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return order;
  }

  async getOrderByNumber(orderNumber) {
    const order = await orderRepository.findByOrderNumber(orderNumber);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return order;
  }

  async getOrdersByUser(userId, options) {
    return orderRepository.findByUserId(userId, options);
  }

  async getAllOrders(options) {
    return orderRepository.findAll(options);
  }

  async updateOrderStatus(id, status, userId = null) {
    const order = await this.getOrderById(id, userId);

    // Validate status transition
    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
      [ORDER_STATUS.CANCELLED]: [],
      [ORDER_STATUS.REFUNDED]: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      const error = new Error(`Cannot transition from ${order.status} to ${status}`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    return orderRepository.updateStatus(id, status);
  }

  async cancelOrder(id, userId, requestId) {
    return sagaService.cancelOrder(id, userId, requestId);
  }

  async updateOrder(id, updateData) {
    const order = await orderRepository.update(id, updateData);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return order;
  }
}

module.exports = new OrderService();
