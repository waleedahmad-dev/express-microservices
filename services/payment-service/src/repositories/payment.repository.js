const { Payment } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class PaymentRepository {
  async create(paymentData) {
    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${uuidv4().split('-')[0].toUpperCase()}`;

    return Payment.create({
      ...paymentData,
      transactionId
    });
  }

  async findById(id) {
    return Payment.findByPk(id);
  }

  async findByTransactionId(transactionId) {
    return Payment.findOne({ where: { transactionId } });
  }

  async findByOrderId(orderId) {
    return Payment.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']]
    });
  }

  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    const where = { userId };

    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    return {
      payments: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      userId = null,
      orderId = null,
      fromDate = null,
      toDate = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt[Op.lte] = new Date(toDate);
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    return {
      payments: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async update(id, updateData) {
    const payment = await Payment.findByPk(id);
    if (!payment) return null;

    await payment.update(updateData);
    return payment;
  }

  async updateStatus(id, status, additionalData = {}) {
    return this.update(id, { status, ...additionalData });
  }
}

module.exports = new PaymentRepository();
