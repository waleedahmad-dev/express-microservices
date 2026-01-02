const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validation.middleware');
const {
  createProductDto,
  updateProductDto,
  updateInventoryDto,
  checkAvailabilityDto,
  productIdParam,
  paginationQuery
} = require('../dtos/product.dto');

const router = express.Router();

// Get all products
router.get('/', paginationQuery, validate, productController.getAll);

// Check product availability (for order service)
router.post('/check-availability', checkAvailabilityDto, validate, productController.checkAvailability);

// Reserve inventory (for order service)
router.post('/reserve-inventory', checkAvailabilityDto, validate, productController.reserveInventory);

// Release inventory (for order service rollback)
router.post('/release-inventory', checkAvailabilityDto, validate, productController.releaseInventory);

// Get product by ID
router.get('/:id', productIdParam, validate, productController.getById);

// Create product
router.post('/', createProductDto, validate, productController.create);

// Update product
router.put('/:id', [...productIdParam, ...updateProductDto], validate, productController.update);

// Update inventory
router.patch('/:id/inventory', [...productIdParam, ...updateInventoryDto], validate, productController.updateInventory);

// Delete product
router.delete('/:id', productIdParam, validate, productController.delete);

module.exports = router;
