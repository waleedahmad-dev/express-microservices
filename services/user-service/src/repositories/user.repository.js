const User = require('../models/user.model');
const { Op } = require('sequelize');

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }

  async findById(id) {
    return User.findByPk(id);
  }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = null,
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    const where = {};

    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== null) {
      where.isActive = isActive;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['password'] }
    });

    return {
      users: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async update(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) return null;

    await user.update(updateData);
    return user;
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;

    await user.destroy();
    return true;
  }

  async updateLastLogin(id) {
    return User.update(
      { lastLoginAt: new Date() },
      { where: { id } }
    );
  }

  async count(where = {}) {
    return User.count({ where });
  }

  async existsByEmail(email) {
    const count = await User.count({ where: { email } });
    return count > 0;
  }
}

module.exports = new UserRepository();
