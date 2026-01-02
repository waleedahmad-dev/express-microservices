const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES, PAYMENT_STATUS } = require('../../../../shared/constants');

const { sequelize } = createDatabaseConnection(SERVICES.PAYMENT_SERVICE);

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'transaction_id'
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id'
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'order_number'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM(Object.values(PAYMENT_STATUS)),
    defaultValue: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'payment_method'
  },
  paymentProvider: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'mock',
    field: 'payment_provider'
  },
  providerTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'provider_transaction_id'
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'failure_reason'
  },
  refundedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'refunded_amount'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['transaction_id'] },
    { fields: ['order_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] }
  ]
});

module.exports = Payment;
