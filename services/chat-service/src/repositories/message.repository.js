const { Message, Room } = require('../models');
const { Op } = require('sequelize');

class MessageRepository {
  async create(messageData) {
    const message = await Message.create(messageData);

    // Update room's updatedAt
    await Room.update(
      { updatedAt: new Date() },
      { where: { id: messageData.roomId } }
    );

    return this.findById(message.id);
  }

  async findById(id) {
    return Message.findByPk(id, {
      include: [{ model: Message, as: 'replyTo' }]
    });
  }

  async findByRoomId(roomId, options = {}) {
    const {
      page = 1,
      limit = 50,
      before = null,
      after = null
    } = options;

    const where = {
      roomId,
      isDeleted: false
    };

    if (before) {
      where.createdAt = { [Op.lt]: new Date(before) };
    }

    if (after) {
      where.createdAt = { ...where.createdAt, [Op.gt]: new Date(after) };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Message.findAndCountAll({
      where,
      include: [{ model: Message, as: 'replyTo' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      messages: rows.reverse(), // Return in chronological order
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async update(id, updateData) {
    const message = await Message.findByPk(id);
    if (!message) return null;

    await message.update({
      ...updateData,
      isEdited: true,
      editedAt: new Date()
    });

    return this.findById(id);
  }

  async delete(id) {
    const message = await Message.findByPk(id);
    if (!message) return false;

    // Soft delete
    await message.update({
      isDeleted: true,
      content: '[Message deleted]'
    });

    return true;
  }

  async getUnreadCount(roomId, userId, lastReadAt) {
    const where = {
      roomId,
      isDeleted: false,
      senderId: { [Op.ne]: userId }
    };

    if (lastReadAt) {
      where.createdAt = { [Op.gt]: lastReadAt };
    }

    return Message.count({ where });
  }

  async search(roomId, query, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await Message.findAndCountAll({
      where: {
        roomId,
        isDeleted: false,
        content: { [Op.like]: `%${query}%` }
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      messages: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = new MessageRepository();
