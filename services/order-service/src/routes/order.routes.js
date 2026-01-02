const express = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validation.middleware');
const {
  createOrderDto,
  updateOrderDto,
  updateStatusDto,
  orderIdParam,
  orderNumberParam,
  paginationQuery
} = require('../dtos/order.dto');

const router = express.Router();

// Get current user's orders
router.get('/my-orders', paginationQuery, validate, orderController.getMyOrders);

// Get all orders (admin)
router.get('/', paginationQuery, validate, orderController.getAll);

// Get order by order number
router.get('/number/:orderNumber', orderNumberParam, validate, orderController.getByOrderNumber);

// Get order by ID
router.get('/:id', orderIdParam, validate, orderController.getById);

// Create order
router.post('/', createOrderDto, validate, orderController.create);

// Update order
router.put('/:id', [...orderIdParam, ...updateOrderDto], validate, orderController.update);

// Update order status (admin)
router.patch('/:id/status', [...orderIdParam, ...updateStatusDto], validate, orderController.updateStatus);

// Cancel order
router.post('/:id/cancel', orderIdParam, validate, orderController.cancel);

module.exports = router;
