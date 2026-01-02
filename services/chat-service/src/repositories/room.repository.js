const { Room, RoomMember, Message } = require('../models');
const { Op } = require('sequelize');

class RoomRepository {
  async create(roomData, creatorId) {
    const room = await Room.create({
      ...roomData,
      createdBy: creatorId
    });

    // Add creator as owner
    await RoomMember.create({
      roomId: room.id,
      userId: creatorId,
      role: 'owner'
    });

    return this.findById(room.id);
  }

  async findById(id) {
    return Room.findByPk(id, {
      include: [{ model: RoomMember, as: 'members' }]
    });
  }

  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null
    } = options;

    const where = {};
    if (type) {
      where.type = type;
    }

    const offset = (page - 1) * limit;

    // Get rooms where user is a member
    const memberRooms = await RoomMember.findAll({
      where: { userId },
      attributes: ['roomId']
    });

    const roomIds = memberRooms.map(m => m.roomId);

    const { count, rows } = await Room.findAndCountAll({
      where: {
        id: { [Op.in]: roomIds },
        isActive: true,
        ...where
      },
      include: [{ model: RoomMember, as: 'members' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updatedAt', 'DESC']]
    });

    return {
      rooms: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async addMember(roomId, userId, role = 'member') {
    const existing = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (existing) {
      return existing;
    }

    return RoomMember.create({
      roomId,
      userId,
      role
    });
  }

  async removeMember(roomId, userId) {
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member) return false;

    await member.destroy();
    return true;
  }

  async isMember(roomId, userId) {
    const count = await RoomMember.count({
      where: { roomId, userId }
    });
    return count > 0;
  }

  async getMembers(roomId) {
    return RoomMember.findAll({
      where: { roomId }
    });
  }

  async update(id, updateData) {
    const room = await Room.findByPk(id);
    if (!room) return null;

    await room.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const room = await Room.findByPk(id);
    if (!room) return false;

    // Soft delete - just mark as inactive
    await room.update({ isActive: false });
    return true;
  }

  async findOrCreatePrivateRoom(userId1, userId2) {
    // Look for existing private room between these two users
    const user1Rooms = await RoomMember.findAll({
      where: { userId: userId1 },
      attributes: ['roomId']
    });

    const user2Rooms = await RoomMember.findAll({
      where: { userId: userId2 },
      attributes: ['roomId']
    });

    const user1RoomIds = user1Rooms.map(r => r.roomId);
    const user2RoomIds = user2Rooms.map(r => r.roomId);

    const commonRoomIds = user1RoomIds.filter(id => user2RoomIds.includes(id));

    if (commonRoomIds.length > 0) {
      // Find private room
      const existingRoom = await Room.findOne({
        where: {
          id: { [Op.in]: commonRoomIds },
          type: 'private',
          isActive: true
        },
        include: [{ model: RoomMember, as: 'members' }]
      });

      if (existingRoom && existingRoom.members.length === 2) {
        return { room: existingRoom, created: false };
      }
    }

    // Create new private room
    const room = await Room.create({
      name: `Private Chat`,
      type: 'private',
      createdBy: userId1
    });

    await RoomMember.bulkCreate([
      { roomId: room.id, userId: userId1, role: 'member' },
      { roomId: room.id, userId: userId2, role: 'member' }
    ]);

    return { room: await this.findById(room.id), created: true };
  }
}

module.exports = new RoomRepository();
