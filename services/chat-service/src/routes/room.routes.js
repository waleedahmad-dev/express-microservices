const express = require('express');
const roomController = require('../controllers/room.controller');
const validate = require('../middlewares/validation.middleware');
const {
  createRoomDto,
  updateRoomDto,
  memberDto,
  roomIdParam,
  paginationQuery
} = require('../dtos/room.dto');

const router = express.Router();

// Get user's rooms
router.get('/', paginationQuery, validate, roomController.getMyRooms);

// Start private chat
router.post('/private', memberDto, validate, roomController.startPrivateChat);

// Create room
router.post('/', createRoomDto, validate, roomController.create);

// Get room by ID
router.get('/:id', roomIdParam, validate, roomController.getById);

// Update room
router.put('/:id', [...roomIdParam, ...updateRoomDto], validate, roomController.update);

// Delete room
router.delete('/:id', roomIdParam, validate, roomController.delete);

// Join room
router.post('/:id/join', roomIdParam, validate, roomController.join);

// Leave room
router.post('/:id/leave', roomIdParam, validate, roomController.leave);

// Add member
router.post('/:id/members', [...roomIdParam, ...memberDto], validate, roomController.addMember);

// Remove member
router.delete('/:id/members', [...roomIdParam, ...memberDto], validate, roomController.removeMember);

// Mark as read
router.post('/:id/read', roomIdParam, validate, roomController.markAsRead);

// Get unread count
router.get('/:id/unread', roomIdParam, validate, roomController.getUnreadCount);

module.exports = router;
