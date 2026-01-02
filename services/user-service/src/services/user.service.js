const userRepository = require('../repositories/user.repository');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, EVENTS, HTTP_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.USER_SERVICE);

class UserService {
  async createUser(userData) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const user = await userRepository.create(userData);

    // Emit USER_CREATED event (simulated via logging)
    logger.info('Event emitted', {
      event: EVENTS.USER_CREATED,
      payload: { userId: user.id, email: user.email }
    });

    return user;
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return user;
  }

  async getUserByEmail(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return user;
  }

  async getAllUsers(options) {
    return userRepository.findAll(options);
  }

  async updateUser(id, updateData) {
    // Prevent updating email to an existing email
    if (updateData.email) {
      const existingUser = await userRepository.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        const error = new Error('Email already in use');
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }
    }

    const user = await userRepository.update(id, updateData);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    logger.info('Event emitted', {
      event: EVENTS.USER_UPDATED,
      payload: { userId: user.id }
    });

    return user;
  }

  async deleteUser(id) {
    const deleted = await userRepository.delete(id);
    if (!deleted) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    logger.info('Event emitted', {
      event: EVENTS.USER_DELETED,
      payload: { userId: id }
    });

    return true;
  }

  async validateCredentials(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return null;
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    return user;
  }
}

module.exports = new UserService();
