const chatService = require('../services/chat.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class ChatController {
  async sendMessage(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { roomId } = req.params;
      const { content, type, replyToId, metadata } = req.body;

      const message = await chatService.sendMessage(
        roomId,
        userId,
        content,
        type,
        replyToId,
        metadata
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { roomId } = req.params;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        before: req.query.before,
        after: req.query.after
      };

      const result = await chatService.getMessages(roomId, userId, options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.messages,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessageById(req, res, next) {
    try {
      const message = await chatService.getMessageById(req.params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async editMessage(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { content } = req.body;

      const message = await chatService.editMessage(req.params.id, userId, content);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Message edited successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];

      await chatService.deleteMessage(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async searchMessages(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { roomId } = req.params;
      const { query, page, limit } = req.query;

      const result = await chatService.searchMessages(roomId, userId, query, { page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.messages,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
