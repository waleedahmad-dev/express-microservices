const express = require('express');
const chatController = require('../controllers/chat.controller');
const validate = require('../middlewares/validation.middleware');
const {
  sendMessageDto,
  editMessageDto,
  messageIdParam,
  roomIdParam,
  paginationQuery,
  searchQuery
} = require('../dtos/chat.dto');

const router = express.Router();

// Get messages for a room
router.get(
  '/rooms/:roomId/messages',
  [...roomIdParam, ...paginationQuery],
  validate,
  chatController.getMessages
);

// Search messages in a room
router.get(
  '/rooms/:roomId/search',
  [...roomIdParam, ...searchQuery, ...paginationQuery],
  validate,
  chatController.searchMessages
);

// Send message to a room
router.post(
  '/rooms/:roomId/messages',
  [...roomIdParam, ...sendMessageDto],
  validate,
  chatController.sendMessage
);

// Get message by ID
router.get(
  '/messages/:id',
  messageIdParam,
  validate,
  chatController.getMessageById
);

// Edit message
router.put(
  '/messages/:id',
  [...messageIdParam, ...editMessageDto],
  validate,
  chatController.editMessage
);

// Delete message
router.delete(
  '/messages/:id',
  messageIdParam,
  validate,
  chatController.deleteMessage
);

module.exports = router;
