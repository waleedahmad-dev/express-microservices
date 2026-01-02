const messageRepository = require('../repositories/message.repository');
const roomRepository = require('../repositories/room.repository');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, EVENTS, HTTP_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.CHAT_SERVICE);

class ChatService {
  async sendMessage(roomId, senderId, content, type = 'text', replyToId = null, metadata = null) {
    // Verify user is member of room
    const isMember = await roomRepository.isMember(roomId, senderId);
    if (!isMember) {
      const error = new Error('You are not a member of this room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    const message = await messageRepository.create({
      roomId,
      senderId,
      content,
      type,
      replyToId,
      metadata
    });

    logger.info('Event emitted', {
      event: EVENTS.MESSAGE_SENT,
      payload: { messageId: message.id, roomId, senderId }
    });

    return message;
  }

  async getMessages(roomId, userId, options) {
    // Verify user is member of room
    const isMember = await roomRepository.isMember(roomId, userId);
    if (!isMember) {
      const error = new Error('You are not a member of this room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return messageRepository.findByRoomId(roomId, options);
  }

  async getMessageById(id) {
    const message = await messageRepository.findById(id);
    if (!message) {
      const error = new Error('Message not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return message;
  }

  async editMessage(id, senderId, content) {
    const message = await this.getMessageById(id);

    if (message.senderId !== senderId) {
      const error = new Error('You can only edit your own messages');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return messageRepository.update(id, { content });
  }

  async deleteMessage(id, userId) {
    const message = await this.getMessageById(id);

    if (message.senderId !== userId) {
      const error = new Error('You can only delete your own messages');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    await messageRepository.delete(id);
    return true;
  }

  async searchMessages(roomId, userId, query, options) {
    const isMember = await roomRepository.isMember(roomId, userId);
    if (!isMember) {
      const error = new Error('You are not a member of this room');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return messageRepository.search(roomId, query, options);
  }
}

module.exports = new ChatService();
