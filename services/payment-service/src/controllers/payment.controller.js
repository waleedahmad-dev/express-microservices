const paymentService = require('../services/payment.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class PaymentController {
  async create(req, res, next) {
    try {
      const userId = req.headers['x-user-id'] || req.body.userId;
      const paymentData = {
        ...req.body,
        userId
      };

      const payment = await paymentService.createPayment(paymentData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Payment processed successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async getByTransactionId(req, res, next) {
    try {
      const payment = await paymentService.getPaymentByTransactionId(req.params.transactionId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async getByOrderId(req, res, next) {
    try {
      const payments = await paymentService.getPaymentsByOrderId(req.params.orderId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyPayments(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await paymentService.getPaymentsByUserId(userId, options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.payments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        userId: req.query.userId,
        orderId: req.query.orderId,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await paymentService.getAllPayments(options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.payments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refund(req, res, next) {
    try {
      const payment = await paymentService.refundPayment(req.params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Payment refunded successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async partialRefund(req, res, next) {
    try {
      const { amount } = req.body;
      const payment = await paymentService.partialRefund(req.params.id, amount);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Partial refund processed successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
