const { Order, OrderItem } = require('../models');
const { Op } = require('sequelize');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES } = require('../../../../shared/constants');

const { sequelize } = createDatabaseConnection(SERVICES.ORDER_SERVICE);

class OrderRepository {
  async create(orderData, items, transaction = null) {
    const options = transaction ? { transaction } : {};

    const order = await Order.create(orderData, options);

    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        ...item,
        orderId: order.id
      }));
      await OrderItem.bulkCreate(orderItems, options);
    }

    return this.findById(order.id);
  }

  async findById(id) {
    return Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }]
    });
  }

  async findByOrderNumber(orderNumber) {
    return Order.findOne({
      where: { orderNumber },
      include: [{ model: OrderItem, as: 'items' }]
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

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    return {
      orders: rows,
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

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    return {
      orders: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async update(id, updateData, transaction = null) {
    const options = transaction ? { transaction } : {};
    const order = await Order.findByPk(id);
    if (!order) return null;

    await order.update(updateData, options);
    return this.findById(id);
  }

  async updateStatus(id, status, transaction = null) {
    return this.update(id, { status }, transaction);
  }

  async delete(id) {
    const order = await Order.findByPk(id);
    if (!order) return false;

    await OrderItem.destroy({ where: { orderId: id } });
    await order.destroy();
    return true;
  }

  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `ORD${year}${month}${day}`;

    const lastOrder = await Order.findOne({
      where: {
        orderNumber: { [Op.like]: `${prefix}%` }
      },
      order: [['orderNumber', 'DESC']]
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  getTransaction() {
    return sequelize.transaction();
  }
}

module.exports = new OrderRepository();
