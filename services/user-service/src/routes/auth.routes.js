const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const { createUserDto, loginDto, refreshTokenDto } = require('../dtos/user.dto');

const router = express.Router();

// Register new user
router.post('/register', createUserDto, validate, authController.register);

// Login
router.post('/login', loginDto, validate, authController.login);

// Refresh token
router.post('/refresh-token', refreshTokenDto, validate, authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
