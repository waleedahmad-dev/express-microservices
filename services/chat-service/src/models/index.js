const Room = require('./room.model');
const RoomMember = require('./roomMember.model');
const Message = require('./message.model');

// Define relationships
Room.hasMany(RoomMember, { foreignKey: 'roomId', as: 'members' });
RoomMember.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Room.hasMany(Message, { foreignKey: 'roomId', as: 'messages' });
Message.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

module.exports = {
  Room,
  RoomMember,
  Message
};
