const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES } = require('../../../../shared/constants');
const chatService = require('../services/chat.service');
const roomService = require('../services/room.service');

const logger = createLogger(SERVICES.CHAT_SERVICE);

// Store connected users
const connectedUsers = new Map();

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Optional: Redis adapter for scaling (commented out)
  // const { createAdapter } = require('@socket.io/redis-adapter');
  // const { createClient } = require('redis');
  // const pubClient = createClient({ url: process.env.REDIS_URL });
  // const subClient = pubClient.duplicate();
  // Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  //   io.adapter(createAdapter(pubClient, subClient));
  //   logger.info('Socket.IO Redis adapter initialized');
  // });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info('User connected', { userId, socketId: socket.id });

    // Store user connection
    connectedUsers.set(userId, socket.id);

    // Emit user online status
    io.emit('user:online', { userId });

    // Join user's rooms
    socket.on('rooms:join', async () => {
      try {
        const result = await roomService.getUserRooms(userId, { limit: 100 });
        result.rooms.forEach(room => {
          socket.join(room.id);
          logger.debug('User joined room', { userId, roomId: room.id });
        });
        socket.emit('rooms:joined', { rooms: result.rooms.map(r => r.id) });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Join specific room
    socket.on('room:join', async ({ roomId }) => {
      try {
        await roomService.getRoomById(roomId, userId);
        socket.join(roomId);
        socket.emit('room:joined', { roomId });
        logger.debug('User joined specific room', { userId, roomId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave room
    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);
      socket.emit('room:left', { roomId });
    });

    // Send message
    socket.on('message:send', async ({ roomId, content, type = 'text', replyToId = null }) => {
      try {
        const message = await chatService.sendMessage(roomId, userId, content, type, replyToId);

        // Emit to all users in room
        io.to(roomId).emit('message:new', {
          message,
          roomId
        });

        logger.debug('Message sent', { userId, roomId, messageId: message.id });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Edit message
    socket.on('message:edit', async ({ messageId, content }) => {
      try {
        const message = await chatService.editMessage(messageId, userId, content);

        // Emit to all users in room
        io.to(message.roomId).emit('message:edited', {
          message,
          roomId: message.roomId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Delete message
    socket.on('message:delete', async ({ messageId, roomId }) => {
      try {
        await chatService.deleteMessage(messageId, userId);

        io.to(roomId).emit('message:deleted', {
          messageId,
          roomId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:started', { userId, roomId });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:stopped', { userId, roomId });
    });

    // Mark as read
    socket.on('room:markRead', async ({ roomId }) => {
      try {
        await roomService.markAsRead(roomId, userId);
        socket.emit('room:markedRead', { roomId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Get online users
    socket.on('users:online', () => {
      const onlineUsers = Array.from(connectedUsers.keys());
      socket.emit('users:onlineList', { users: onlineUsers });
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      connectedUsers.delete(userId);
      io.emit('user:offline', { userId });
      logger.info('User disconnected', { userId, reason });
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const getConnectedUsers = () => connectedUsers;

const isUserOnline = (userId) => connectedUsers.has(userId);

const emitToUser = (userId, event, data) => {
  const socketId = connectedUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToRoom = (roomId, event, data) => {
  if (io) {
    io.to(roomId).emit(event, data);
    return true;
  }
  return false;
};

module.exports = {
  initializeSocket,
  getIO,
  getConnectedUsers,
  isUserOnline,
  emitToUser,
  emitToRoom
};
