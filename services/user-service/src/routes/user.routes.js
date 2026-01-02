const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validation.middleware');
const {
  createUserDto,
  updateUserDto,
  userIdParam,
  paginationQuery
} = require('../dtos/user.dto');

const router = express.Router();

// Get all users (admin)
router.get('/', paginationQuery, validate, userController.getAll);

// Get user profile (current user)
router.get('/profile', userController.getProfile);

// Update user profile (current user)
router.put('/profile', updateUserDto, validate, userController.updateProfile);

// Get user by ID
router.get('/:id', userIdParam, validate, userController.getById);

// Update user by ID (admin)
router.put('/:id', [...userIdParam, ...updateUserDto], validate, userController.update);

// Delete user by ID (admin)
router.delete('/:id', userIdParam, validate, userController.delete);

module.exports = router;
