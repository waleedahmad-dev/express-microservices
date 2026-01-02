const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES, ORDER_STATUS } = require('../../../../shared/constants');

const { sequelize } = createDatabaseConnection(SERVICES.ORDER_SERVICE);

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  status: {
    type: DataTypes.ENUM(Object.values(ORDER_STATUS)),
    defaultValue: ORDER_STATUS.PENDING
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'shipping_cost'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payment_id'
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'payment_status'
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'shipping_address'
  },
  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'billing_address'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_number'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Order;
