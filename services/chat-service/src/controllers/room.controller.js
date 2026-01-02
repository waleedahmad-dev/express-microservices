const roomService = require('../services/room.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class RoomController {
  async create(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const room = await roomService.createRoom(req.body, userId);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Room created successfully',
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const room = await roomService.getRoomById(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyRooms(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        type: req.query.type
      };

      const result = await roomService.getUserRooms(userId, options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.rooms,
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

  async join(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const room = await roomService.joinRoom(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Joined room successfully',
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async leave(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      await roomService.leaveRoom(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { targetUserId } = req.body;
      const room = await roomService.addMember(req.params.id, userId, targetUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Member added successfully',
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { targetUserId } = req.body;
      const room = await roomService.removeMember(req.params.id, userId, targetUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Member removed successfully',
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const room = await roomService.updateRoom(req.params.id, userId, req.body);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Room updated successfully',
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      await roomService.deleteRoom(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async startPrivateChat(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { targetUserId } = req.body;
      const room = await roomService.startPrivateChat(userId, targetUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      await roomService.markAsRead(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const count = await roomService.getUnreadCount(req.params.id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoomController();
