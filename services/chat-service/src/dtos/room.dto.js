const { body, param, query } = require('express-validator');

const createRoomDto = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('type')
    .optional()
    .isIn(['private', 'group', 'support'])
    .withMessage('Invalid room type'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const updateRoomDto = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const memberDto = [
  body('targetUserId')
    .isUUID()
    .withMessage('Target user ID must be a valid UUID')
];

const roomIdParam = [
  param('id')
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
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['private', 'group', 'support'])
    .withMessage('Invalid room type filter')
];

module.exports = {
  createRoomDto,
  updateRoomDto,
  memberDto,
  roomIdParam,
  paginationQuery
};
