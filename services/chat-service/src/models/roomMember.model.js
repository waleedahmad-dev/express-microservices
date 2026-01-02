const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('../../../../shared/config/database');
const { SERVICES } = require('../../../../shared/constants');

const { sequelize } = createDatabaseConnection(SERVICES.CHAT_SERVICE);

const RoomMember = sequelize.define('RoomMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'room_id'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_read_at'
  }
}, {
  tableName: 'room_members',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['room_id', 'user_id'] }
  ]
});

module.exports = RoomMember;
