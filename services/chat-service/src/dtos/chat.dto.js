const { body, param, query } = require('express-validator');

const sendMessageDto = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be 1-5000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'system'])
    .withMessage('Invalid message type'),
  body('replyToId')
    .optional()
    .isUUID()
    .withMessage('Reply to ID must be a valid UUID'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const editMessageDto = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be 1-5000 characters')
];

const messageIdParam = [
  param('id')
    .isUUID()
    .withMessage('Valid message ID is required')
];

const roomIdParam = [
  param('roomId')
    .isUUID()
    .withMessage('Valid room ID is required')
];

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const searchQuery = [
  query('query')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query is required')
];

module.exports = {
  sendMessageDto,
  editMessageDto,
  messageIdParam,
  roomIdParam,
  paginationQuery,
  searchQuery
};
