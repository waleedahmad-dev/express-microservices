const express = require('express');
const paymentController = require('../controllers/payment.controller');
const validate = require('../middlewares/validation.middleware');
const {
  createPaymentDto,
  partialRefundDto,
  paymentIdParam,
  transactionIdParam,
  orderIdParam,
  paginationQuery
} = require('../dtos/payment.dto');

const router = express.Router();

// Get current user's payments
router.get('/my-payments', paginationQuery, validate, paymentController.getMyPayments);

// Get all payments (admin)
router.get('/', paginationQuery, validate, paymentController.getAll);

// Get payment by transaction ID
router.get('/transaction/:transactionId', transactionIdParam, validate, paymentController.getByTransactionId);

// Get payments by order ID
router.get('/order/:orderId', orderIdParam, validate, paymentController.getByOrderId);

// Get payment by ID
router.get('/:id', paymentIdParam, validate, paymentController.getById);

// Create payment
router.post('/', createPaymentDto, validate, paymentController.create);

// Refund payment
router.post('/:id/refund', paymentIdParam, validate, paymentController.refund);

// Partial refund
router.post('/:id/partial-refund', [...paymentIdParam, ...partialRefundDto], validate, paymentController.partialRefund);

module.exports = router;
