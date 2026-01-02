const { createLogger } = require('../../../../shared/logger');
const { SERVICES, EVENTS, ORDER_STATUS, PAYMENT_STATUS } = require('../../../../shared/constants');
const { productServiceClient, paymentServiceClient } = require('../utils/serviceClient');
const orderRepository = require('../repositories/order.repository');

const logger = createLogger(SERVICES.ORDER_SERVICE);

/**
 * Saga Orchestrator for Order Processing
 * Implements the Saga pattern for distributed transactions
 *
 * Steps:
 * 1. Validate and reserve inventory (Product Service)
 * 2. Process payment (Payment Service)
 * 3. Confirm order
 *
 * Compensating transactions (rollback):
 * - Release inventory if payment fails
 * - Refund payment if order confirmation fails
 */
class OrderSaga {
  constructor(requestId) {
    this.requestId = requestId;
    this.steps = [];
    this.compensations = [];
  }

  addStep(name, action, compensation) {
    this.steps.push({ name, action, compensation });
  }

  async execute() {
    const results = {};

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      try {
        logger.info(`Saga step: ${step.name}`, { requestId: this.requestId });
        results[step.name] = await step.action();

        // Store compensation for potential rollback
        if (step.compensation) {
          this.compensations.unshift({
            name: step.name,
            action: step.compensation,
            data: results[step.name]
          });
        }
      } catch (error) {
        logger.error(`Saga step failed: ${step.name}`, {
          requestId: this.requestId,
          error: error.message
        });

        // Execute compensating transactions
        await this.rollback();

        throw error;
      }
    }

    return results;
  }

  async rollback() {
    logger.warn('Executing saga rollback', { requestId: this.requestId });

    for (const compensation of this.compensations) {
      try {
        logger.info(`Rollback step: ${compensation.name}`, { requestId: this.requestId });
        await compensation.action(compensation.data);
      } catch (error) {
        logger.error(`Rollback failed: ${compensation.name}`, {
          requestId: this.requestId,
          error: error.message
        });
        // Continue with other compensations even if one fails
      }
    }
  }
}

class SagaService {
  async createOrder(orderData, items, userId, requestId) {
    const saga = new OrderSaga(requestId);

    // Configure service clients with request context
    productServiceClient.setRequestId(requestId).setUserId(userId);
    paymentServiceClient.setRequestId(requestId).setUserId(userId);

    let order = null;
    let inventoryReserved = [];

    // Step 1: Check product availability
    saga.addStep(
      'checkAvailability',
      async () => {
        const checkItems = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));

        const response = await productServiceClient.post('/products/check-availability', { items: checkItems });
        const availability = response.data.data;

        const unavailable = availability.filter(item => !item.available);
        if (unavailable.length > 0) {
          const error = new Error('Some products are not available');
          error.details = unavailable;
          throw error;
        }

        return availability;
      },
      null // No compensation needed for read operation
    );

    // Step 2: Reserve inventory
    saga.addStep(
      'reserveInventory',
      async () => {
        const reserveItems = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));

        const response = await productServiceClient.post('/products/reserve-inventory', { items: reserveItems });
        inventoryReserved = response.data.data;
        return inventoryReserved;
      },
      async () => {
        // Compensation: Release reserved inventory
        if (inventoryReserved.length > 0) {
          await productServiceClient.post('/products/release-inventory', { items: inventoryReserved });
          logger.info('Inventory released during rollback', { requestId });
        }
      }
    );

    // Step 3: Create order record
    saga.addStep(
      'createOrderRecord',
      async () => {
        const orderNumber = await orderRepository.generateOrderNumber();
        const transaction = await orderRepository.getTransaction();

        try {
          order = await orderRepository.create(
            {
              orderNumber,
              userId,
              ...orderData,
              status: ORDER_STATUS.PENDING
            },
            items,
            transaction
          );

          await transaction.commit();

          logger.info('Event emitted', {
            event: EVENTS.ORDER_CREATED,
            payload: { orderId: order.id, orderNumber }
          });

          return order;
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      },
      async () => {
        // Compensation: Delete order record
        if (order) {
          await orderRepository.delete(order.id);
          logger.info('Order record deleted during rollback', { requestId, orderId: order.id });
        }
      }
    );

    // Step 4: Process payment
    saga.addStep(
      'processPayment',
      async () => {
        const paymentData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.total,
          currency: order.currency,
          userId,
          metadata: {
            items: items.length
          }
        };

        const response = await paymentServiceClient.post('/payments', paymentData);
        const payment = response.data.data;

        // Update order with payment info
        await orderRepository.update(order.id, {
          paymentId: payment.id,
          paymentStatus: payment.status
        });

        return payment;
      },
      async (paymentData) => {
        // Compensation: Refund payment
        if (paymentData && paymentData.id) {
          try {
            await paymentServiceClient.post(`/payments/${paymentData.id}/refund`);
            logger.info('Payment refunded during rollback', { requestId, paymentId: paymentData.id });
          } catch (error) {
            logger.error('Failed to refund payment during rollback', { error: error.message });
          }
        }
      }
    );

    // Step 5: Confirm order
    saga.addStep(
      'confirmOrder',
      async () => {
        const updatedOrder = await orderRepository.updateStatus(order.id, ORDER_STATUS.CONFIRMED);

        logger.info('Event emitted', {
          event: EVENTS.ORDER_UPDATED,
          payload: { orderId: order.id, status: ORDER_STATUS.CONFIRMED }
        });

        return updatedOrder;
      },
      async () => {
        // Compensation: Cancel order
        if (order) {
          await orderRepository.updateStatus(order.id, ORDER_STATUS.CANCELLED);
          logger.info('Order cancelled during rollback', { requestId, orderId: order.id });
        }
      }
    );

    // Execute saga
    const results = await saga.execute();
    return results.confirmOrder;
  }

  async cancelOrder(orderId, userId, requestId) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.userId !== userId) {
      const error = new Error('Unauthorized to cancel this order');
      error.statusCode = 403;
      throw error;
    }

    if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status)) {
      const error = new Error('Order cannot be cancelled in current status');
      error.statusCode = 400;
      throw error;
    }

    productServiceClient.setRequestId(requestId).setUserId(userId);
    paymentServiceClient.setRequestId(requestId).setUserId(userId);

    // Release inventory
    const items = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      await productServiceClient.post('/products/release-inventory', { items });
    } catch (error) {
      logger.error('Failed to release inventory during cancellation', { error: error.message });
    }

    // Refund payment if exists
    if (order.paymentId) {
      try {
        await paymentServiceClient.post(`/payments/${order.paymentId}/refund`);
      } catch (error) {
        logger.error('Failed to refund payment during cancellation', { error: error.message });
      }
    }

    // Update order status
    const cancelledOrder = await orderRepository.updateStatus(orderId, ORDER_STATUS.CANCELLED);

    logger.info('Event emitted', {
      event: EVENTS.ORDER_CANCELLED,
      payload: { orderId, userId }
    });

    return cancelledOrder;
  }
}

module.exports = new SagaService();
