const jwt = require('jsonwebtoken');
const userService = require('./user.service');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, HTTP_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.USER_SERVICE);

class AuthService {
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async register(userData) {
    const user = await userService.createUser(userData);
    const tokens = this.generateTokens(user);

    logger.info('User registered successfully', { userId: user.id });

    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  async login(email, password) {
    const user = await userService.validateCredentials(email, password);

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    const tokens = this.generateTokens(user);

    logger.info('User logged in successfully', { userId: user.id });

    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      const user = await userService.getUserById(decoded.userId);

      if (!user.isActive) {
        const error = new Error('Account is deactivated');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      const tokens = this.generateTokens(user);

      return {
        user: user.toJSON(),
        ...tokens
      };
    } catch (error) {
      if (error.statusCode) throw error;

      const newError = new Error('Invalid refresh token');
      newError.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw newError;
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();
