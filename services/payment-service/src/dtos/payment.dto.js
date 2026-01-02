const { body, param, query } = require('express-validator');
const { PAYMENT_STATUS } = require('../../../../shared/constants');

const createPaymentDto = [
  body('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('orderNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'bank_transfer', 'wallet'])
    .withMessage('Invalid payment method'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const partialRefundDto = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be a positive number')
];

const paymentIdParam = [
  param('id')
    .isUUID()
    .withMessage('Valid payment ID is required')
];

const transactionIdParam = [
  param('transactionId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Transaction ID is required')
];

const orderIdParam = [
  param('orderId')
    .isUUID()
    .withMessage('Valid order ID is required')
];

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(Object.values(PAYMENT_STATUS))
    .withMessage('Invalid status'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

module.exports = {
  createPaymentDto,
  partialRefundDto,
  paymentIdParam,
  transactionIdParam,
  orderIdParam,
  paginationQuery
};
