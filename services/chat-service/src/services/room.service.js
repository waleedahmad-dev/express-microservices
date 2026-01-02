const roomRepository = require('../repositories/room.repository');
const messageRepository = require('../repositories/message.repository');
const { RoomMember } = require('../models');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, HTTP_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.CHAT_SERVICE);

class RoomService {
  async createRoom(roomData, creatorId) {
    const room = await roomRepository.create(roomData, creatorId);
    logger.info('Room created', { roomId: room.id, creatorId });
    return room;
  }

  async getRoomById(id, userId) {
    const room = await roomRepository.findById(id);

    if (!room) {
      const error = new Error('Room not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Check membership
    const isMember = await roomRepository.isMember(id, userId);
    if (!isMember) {
      const error = new Error('You are not a member of this room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return room;
  }

  async getUserRooms(userId, options) {
    return roomRepository.findByUserId(userId, options);
  }

  async joinRoom(roomId, userId) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      const error = new Error('Room not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (room.type === 'private') {
      const error = new Error('Cannot join private rooms');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    await roomRepository.addMember(roomId, userId);
    logger.info('User joined room', { roomId, userId });

    return roomRepository.findById(roomId);
  }

  async leaveRoom(roomId, userId) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      const error = new Error('Room not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const removed = await roomRepository.removeMember(roomId, userId);
    if (!removed) {
      const error = new Error('You are not a member of this room');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    logger.info('User left room', { roomId, userId });
    return true;
  }

  async addMember(roomId, userId, targetUserId) {
    const room = await this.getRoomById(roomId, userId);

    // Check if user has permission to add members
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      const error = new Error('You do not have permission to add members');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    await roomRepository.addMember(roomId, targetUserId);
    logger.info('Member added to room', { roomId, targetUserId, addedBy: userId });

    return roomRepository.findById(roomId);
  }

  async removeMember(roomId, userId, targetUserId) {
    const room = await this.getRoomById(roomId, userId);

    // Check if user has permission to remove members
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      const error = new Error('You do not have permission to remove members');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    // Cannot remove owner
    const targetMember = await RoomMember.findOne({
      where: { roomId, userId: targetUserId }
    });

    if (targetMember?.role === 'owner') {
      const error = new Error('Cannot remove room owner');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    await roomRepository.removeMember(roomId, targetUserId);
    logger.info('Member removed from room', { roomId, targetUserId, removedBy: userId });

    return roomRepository.findById(roomId);
  }

  async updateRoom(roomId, userId, updateData) {
    const room = await this.getRoomById(roomId, userId);

    // Check if user has permission
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      const error = new Error('You do not have permission to update this room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return roomRepository.update(roomId, updateData);
  }

  async deleteRoom(roomId, userId) {
    const room = await this.getRoomById(roomId, userId);

    // Only owner can delete
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member || member.role !== 'owner') {
      const error = new Error('Only room owner can delete the room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    await roomRepository.delete(roomId);
    logger.info('Room deleted', { roomId, deletedBy: userId });
    return true;
  }

  async startPrivateChat(userId, targetUserId) {
    if (userId === targetUserId) {
      const error = new Error('Cannot start chat with yourself');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const { room, created } = await roomRepository.findOrCreatePrivateRoom(userId, targetUserId);

    if (created) {
      logger.info('Private chat created', { roomId: room.id, users: [userId, targetUserId] });
    }

    return room;
  }

  async markAsRead(roomId, userId) {
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member) {
      const error = new Error('You are not a member of this room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    await member.update({ lastReadAt: new Date() });
    return true;
  }

  async getUnreadCount(roomId, userId) {
    const member = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!member) {
      return 0;
    }

    return messageRepository.getUnreadCount(roomId, userId, member.lastReadAt);
  }
}

module.exports = new RoomService();
