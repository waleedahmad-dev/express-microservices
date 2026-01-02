const paymentRepository = require('../repositories/payment.repository');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, EVENTS, HTTP_STATUS, PAYMENT_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.PAYMENT_SERVICE);

/**
 * Mock Payment Processor
 * Simulates payment processing with configurable success rate
 */
class MockPaymentProcessor {
  constructor() {
    this.successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE) || 0.9; // 90% success rate
    this.processingDelay = parseInt(process.env.PAYMENT_PROCESSING_DELAY) || 1000; // 1 second
  }

  async process(paymentData) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.processingDelay));

    // Simulate success/failure based on success rate
    const isSuccess = Math.random() < this.successRate;

    if (isSuccess) {
      return {
        success: true,
        providerTransactionId: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`,
        message: 'Payment processed successfully'
      };
    } else {
      return {
        success: false,
        providerTransactionId: null,
        message: 'Payment declined by provider',
        reason: this.getRandomFailureReason()
      };
    }
  }

  getRandomFailureReason() {
    const reasons = [
      'Insufficient funds',
      'Card declined',
      'Invalid card number',
      'Card expired',
      'Transaction limit exceeded',
      'Suspected fraud'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  async refund(payment) {
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, this.processingDelay));

    return {
      success: true,
      refundTransactionId: `REFUND_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`,
      message: 'Refund processed successfully'
    };
  }
}

class PaymentService {
  constructor() {
    this.paymentProcessor = new MockPaymentProcessor();
  }

  async createPayment(paymentData) {
    const payment = await paymentRepository.create({
      orderId: paymentData.orderId,
      orderNumber: paymentData.orderNumber,
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      paymentMethod: paymentData.paymentMethod || 'credit_card',
      status: PAYMENT_STATUS.PROCESSING,
      metadata: paymentData.metadata
    });

    logger.info('Event emitted', {
      event: EVENTS.PAYMENT_INITIATED,
      payload: { paymentId: payment.id, orderId: payment.orderId }
    });

    // Process payment
    const result = await this.paymentProcessor.process(paymentData);

    if (result.success) {
      await paymentRepository.updateStatus(payment.id, PAYMENT_STATUS.COMPLETED, {
        providerTransactionId: result.providerTransactionId,
        processedAt: new Date()
      });

      logger.info('Event emitted', {
        event: EVENTS.PAYMENT_SUCCESS,
        payload: {
          paymentId: payment.id,
          orderId: payment.orderId,
          transactionId: payment.transactionId
        }
      });

      return paymentRepository.findById(payment.id);
    } else {
      await paymentRepository.updateStatus(payment.id, PAYMENT_STATUS.FAILED, {
        failureReason: result.reason,
        processedAt: new Date()
      });

      logger.info('Event emitted', {
        event: EVENTS.PAYMENT_FAILED,
        payload: {
          paymentId: payment.id,
          orderId: payment.orderId,
          reason: result.reason
        }
      });

      const error = new Error('Payment processing failed');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.details = { reason: result.reason };
      throw error;
    }
  }

  async getPaymentById(id) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return payment;
  }

  async getPaymentByTransactionId(transactionId) {
    const payment = await paymentRepository.findByTransactionId(transactionId);
    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return payment;
  }

  async getPaymentsByOrderId(orderId) {
    return paymentRepository.findByOrderId(orderId);
  }

  async getPaymentsByUserId(userId, options) {
    return paymentRepository.findByUserId(userId, options);
  }

  async getAllPayments(options) {
    return paymentRepository.findAll(options);
  }

  async refundPayment(id) {
    const payment = await this.getPaymentById(id);

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      const error = new Error('Only completed payments can be refunded');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    if (payment.refundedAmount >= parseFloat(payment.amount)) {
      const error = new Error('Payment has already been fully refunded');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const result = await this.paymentProcessor.refund(payment);

    if (result.success) {
      const updatedPayment = await paymentRepository.update(id, {
        status: PAYMENT_STATUS.REFUNDED,
        refundedAmount: payment.amount,
        metadata: {
          ...payment.metadata,
          refundTransactionId: result.refundTransactionId,
          refundedAt: new Date().toISOString()
        }
      });

      logger.info('Payment refunded', {
        paymentId: id,
        refundTransactionId: result.refundTransactionId
      });

      return updatedPayment;
    } else {
      const error = new Error('Refund processing failed');
      error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw error;
    }
  }

  async partialRefund(id, amount) {
    const payment = await this.getPaymentById(id);

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      const error = new Error('Only completed payments can be refunded');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const remainingAmount = parseFloat(payment.amount) - parseFloat(payment.refundedAmount);
    if (amount > remainingAmount) {
      const error = new Error(`Refund amount exceeds remaining balance of ${remainingAmount}`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const result = await this.paymentProcessor.refund({ ...payment.toJSON(), amount });

    if (result.success) {
      const newRefundedAmount = parseFloat(payment.refundedAmount) + amount;
      const isFullyRefunded = newRefundedAmount >= parseFloat(payment.amount);

      const updatedPayment = await paymentRepository.update(id, {
        status: isFullyRefunded ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.COMPLETED,
        refundedAmount: newRefundedAmount,
        metadata: {
          ...payment.metadata,
          partialRefunds: [
            ...(payment.metadata?.partialRefunds || []),
            {
              amount,
              refundTransactionId: result.refundTransactionId,
              refundedAt: new Date().toISOString()
            }
          ]
        }
      });

      logger.info('Partial refund processed', {
        paymentId: id,
        refundAmount: amount,
        refundTransactionId: result.refundTransactionId
      });

      return updatedPayment;
    } else {
      const error = new Error('Refund processing failed');
      error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw error;
    }
  }
}

module.exports = new PaymentService();
