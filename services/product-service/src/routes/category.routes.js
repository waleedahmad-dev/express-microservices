const express = require('express');
const categoryController = require('../controllers/category.controller');
const validate = require('../middlewares/validation.middleware');
const {
  createCategoryDto,
  updateCategoryDto,
  categoryIdParam,
  categorySlugParam
} = require('../dtos/category.dto');

const router = express.Router();

// Get category tree
router.get('/tree', categoryController.getTree);

// Get all categories
router.get('/', categoryController.getAll);

// Get category by slug
router.get('/slug/:slug', categorySlugParam, validate, categoryController.getBySlug);

// Get category by ID
router.get('/:id', categoryIdParam, validate, categoryController.getById);

// Create category
router.post('/', createCategoryDto, validate, categoryController.create);

// Update category
router.put('/:id', [...categoryIdParam, ...updateCategoryDto], validate, categoryController.update);

// Delete category
router.delete('/:id', categoryIdParam, validate, categoryController.delete);

module.exports = router;
