const userService = require('../services/user.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class UserController {
  async create(req, res, next) {
    try {
      const user = await userService.createUser(req.body);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
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
        search: req.query.search,
        role: req.query.role,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await userService.getAllUsers(options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.users,
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

  async update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const user = await userService.getUserById(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      // Prevent role and isActive changes via profile update
      const { role, isActive, ...updateData } = req.body;
      const user = await userService.updateUser(userId, updateData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
