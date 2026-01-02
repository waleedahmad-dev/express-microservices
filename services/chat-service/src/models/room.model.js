const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES } = require('../../../../shared/constants');

const { sequelize } = createDatabaseConnection(SERVICES.CHAT_SERVICE);

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('private', 'group', 'support'),
    defaultValue: 'private'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'rooms',
  timestamps: true,
  underscored: true
});

module.exports = Room;
