const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');
const jwt = require('jsonwebtoken');

// Store connected users: { userId: { socketId, room, role } }
const connectedUsers = {};

// Store typing users: { conversationId: [userId1, userId2] }
const typingUsers = {};

const VALID_MESSAGE_TYPES = new Set(['text', 'image', 'video', 'audio', 'pdf']);

const normalizeMessagePayload = ({ message, content, type, attachments = [] }) => {
  const normalizedText = String(content || message || '').trim();
  const normalizedAttachments = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  const primaryAttachment = normalizedAttachments[0] || null;

  let resolvedType = type;
  if (!VALID_MESSAGE_TYPES.has(resolvedType)) {
    resolvedType = primaryAttachment?.type || (normalizedText ? 'text' : null);
  }
  if (!VALID_MESSAGE_TYPES.has(resolvedType)) {
    resolvedType = normalizedText ? 'text' : null;
  }

  return {
    content: normalizedText,
    message: normalizedText,
    type: resolvedType,
    attachments: normalizedAttachments,
    fileUrl: primaryAttachment?.url || '',
    fileName: primaryAttachment?.name || '',
    fileSize: primaryAttachment?.size || 0,
  };
};

const buildLastMessagePreview = (payload) => {
  if (payload.content) {
    return payload.content.substring(0, 100);
  }

  switch (payload.type) {
    case 'image':
      return 'Sent an image';
    case 'video':
      return 'Sent a video';
    case 'audio':
      return 'Sent an audio file';
    case 'pdf':
      return 'Sent a PDF';
    default:
      return 'Sent an attachment';
  }
};

const buildConversationLookupQuery = (conversationId) => {
  if (!conversationId) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(conversationId)) {
    return {
      $or: [{ _id: conversationId }, { conversationId }],
    };
  }

  return { conversationId };
};

const extractEntityId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  if (value.id) {
    return value.id.toString();
  }

  return value.toString();
};

module.exports = function setupSocketIO(io) {
  // === PRODUCTION-READY SOCKET AUTHENTICATION MIDDLEWARE ===
  io.use((socket, next) => {
    try {
      // Extract token from auth data
      let token = socket.handshake.auth?.token;
      
      console.log(`[Socket ${socket.id}] 🔍 Auth middleware - token provided:`, !!token, 'JWT_SECRET exists:', !!process.env.JWT_SECRET);
      
      if (!token) {
        console.warn(`[Socket ${socket.id}] ⚠️ No token provided in auth data`);
        console.warn(`[Socket ${socket.id}] socket.handshake.auth:`, JSON.stringify(socket.handshake.auth, null, 2));
        socket.userId = null;
        socket.isAuthenticated = false;
        return next(); // Allow connection but mark as unauthenticated
      }

      console.log(`[Socket ${socket.id}] Token received - length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...`);

      // Clean up token (remove quotes, Bearer prefix, etc.)
      if (typeof token === 'string') {
        token = token.trim();
        if (token.startsWith('Bearer ')) {
          token = token.slice(7);
          console.log(`[Socket ${socket.id}] 🧹 Removed Bearer prefix`);
        }
        token = token.replace(/^"|"$/g, '');
        if (token.includes('"')) {
          console.log(`[Socket ${socket.id}] 🧹 Removed surrounding quotes`);
        }
      }

      console.log(`[Socket ${socket.id}] Token after cleaning - length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...`);

      // Verify and decode JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log(`[Socket ${socket.id}] ✅ JWT verified successfully - decoded:`, {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      });
      
      if (!decoded.id) {
        console.error(`[Socket ${socket.id}] ❌ JWT decoded but missing user id`);
        socket.userId = null;
        socket.isAuthenticated = false;
        return next();
      }

      // Successfully authenticated
      socket.userId = decoded.id || decoded.userId; // Support both id and userId formats
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      socket.isAuthenticated = true;
      
      console.log(
        `[Socket ${socket.id}] ✅ Authenticated - userId: ${decoded.id}, role: ${decoded.role}, email: ${decoded.email}`
      );
      
      next();
    } catch (err) {
      console.error(`[Socket ${socket.id}] 🔒 Authentication failed:`, {
        error: err.message,
        errorCode: err.code,
        tokenProvided: !!socket.handshake.auth?.token,
        JWT_SECRET_exists: !!process.env.JWT_SECRET,
      });
      
      socket.userId = null;
      socket.isAuthenticated = false;
      
      // Still allow connection but mark as unauthenticated
      // (later operations will require authentication)
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId || null;
    const userRole = socket.userRole || null;
    const isAuthenticated = socket.isAuthenticated || false;

    console.log(
      `[Socket ${socket.id}] 🔌 Connection established - ` +
      `userId: ${userId}, authenticated: ${isAuthenticated}`
    );

    console.log(`Socket ${socket.id} connected${userId ? ` (user ${userId})` : ' (anonymous)'}`);

    if (userId) {
      // Store authenticated user connection info
      connectedUsers[userId] = {
        socketId: socket.id,
        role: userRole,
        connectedAt: new Date(),
      };

      // Broadcast user online status
      socket.broadcast.emit('userOnline', {
        userId,
        status: 'online',
        joinedAt: new Date(),
      });
    }

    // ===========================
    // ROOM MANAGEMENT EVENTS
    // ===========================

    /**
     * joinRoom - User joins a chat room
     * Data: { conversationId, jobId }
     */
    socket.on('joinRoom', async ({ conversationId, jobId }) => {
      try {
        // Authentication check
        if (!userId) {
          socket.emit('error', { 
            msg: 'Authentication required to join room',
            code: 'AUTH_REQUIRED'
          });
          console.warn(
            `[Socket ${socket.id}] ❌ Unauthenticated joinRoom attempt. ` +
            `userId: ${userId}, isAuth: ${isAuthenticated}`
          );
          return;
        }

        if (!conversationId && !jobId) {
          socket.emit('error', { msg: 'Job ID or Conversation ID required for join' });
          return;
        }

        let roomName = conversationId;
        console.log(
          `[Socket ${socket.id}] 📍 joinRoom - userId: ${userId}, ` +
          `conversationId: ${conversationId}, jobId: ${jobId}`
        );

        if (userId && conversationId) {
          // Authenticated user: verify access and get proper room name
          const conversationLookup = buildConversationLookupQuery(conversationId);
          const conversation = conversationLookup
            ? await Conversation.findOne(conversationLookup)
            : null;

          if (conversation) {
            const employerId = extractEntityId(conversation.employerId);
            const workerId = extractEntityId(conversation.workerId);
            const isEmployer = employerId === userId;
            const isWorker = workerId === userId;
            if (!isEmployer && !isWorker) {
              socket.emit('error', { msg: 'Not authorized to join this room' });
              return;
            }
            // Use the conversation's conversationId string as room name for consistency
            roomName = conversation.conversationId || conversation._id.toString();
            connectedUsers[userId].room = roomName;
            console.log(`  🔐 Authenticated user ${userId} verified for room: ${roomName}`);
          }
        } else if (!userId && !jobId) {
          socket.emit('error', { msg: 'Job ID or Conversation ID required for join' });
          return;
        } else if (!userId && jobId) {
          // Anonymous user
          roomName = `job-${jobId}`;
          console.log(`  👤 Anonymous user joining room: ${roomName}`);
        }

        socket.join(roomName);
        console.log(`✅ Socket ${socket.id} joined room: ${roomName}`);

        socket.emit('joinedRoom', { room: roomName, anonymous: !userId });
        socket.to(roomName).emit('userJoinedRoom', { 
          userId: userId || 'anonymous', 
          room: roomName, 
          anonymous: !userId 
        });

      } catch (err) {
        console.error('Error in joinRoom:', err);
        if (err && err.stack) console.error(err.stack);
        socket.emit('error', { msg: 'Error joining room' });
      }
    });

    /**
     * leaveRoom - User leaves a chat room
     * Data: { conversationId }
     */
    socket.on('leaveRoom', (data) => {
      try {
        const { room, conversationId: convId, jobId } = data || {};
        const leaveRoom = room || convId || `job-${jobId}` || 'default';
        socket.leave(leaveRoom);
        if (userId && connectedUsers[userId]) {
          delete connectedUsers[userId].room;
        }

        socket.to(leaveRoom).emit('userLeftRoom', {
          userId: userId || 'anonymous',
          room: leaveRoom,
          status: 'offline',
          leftAt: new Date(),
        });

        console.log(`${userId ? `User ${userId}` : 'Anonymous'} left room ${leaveRoom}`);
      } catch (err) {
        console.error('Error in leaveRoom:', err);
      }
    });

    // ===========================
    // MESSAGING EVENTS
    // ===========================

    /**
     * sendMessage - User sends a message
     * Data: { conversationId, message, attachments }
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, message, content, type, attachments = [] } = data;
        const normalizedPayload = normalizeMessagePayload({ message, content, type, attachments });

        // Validation 1: Message or attachments must exist
        const hasMessage = normalizedPayload.content !== '';
        const hasAttachments = normalizedPayload.attachments.length > 0;
        
        if (!hasMessage && !hasAttachments) {
          socket.emit('error', { msg: 'Message or attachments required' });
          console.warn(`[Socket ${socket.id}] Empty message and no attachments`);
          return;
        }

        if (!normalizedPayload.type) {
          socket.emit('error', { msg: 'Invalid message type' });
          return;
        }

        // Validation 2: User must be authenticated
        if (!userId) {
          socket.emit('error', { 
            msg: 'You must be logged in to send messages',
            code: 'AUTH_REQUIRED'
          });
          console.warn(
            `[Socket ${socket.id}] ❌ Unauthenticated sendMessage attempt. ` +
            `userID: ${userId}, auth: ${isAuthenticated}`
          );
          return;
        }

        // Validation 3: ConversationId required
        if (!conversationId) {
          socket.emit('error', { msg: 'Conversation ID is required' });
          return;
        }

        console.log(`[Socket ${socket.id}] 📤 sendMessage - userId: ${userId}, convId: ${conversationId}`);


        // Fetch conversation by either _id or conversationId
        const conversationLookup = buildConversationLookupQuery(conversationId);
        const conversation = conversationLookup
          ? await Conversation.findOne(conversationLookup)
          : null;

        if (!conversation) {
          console.error('❌ Conversation not found:', conversationId);
          socket.emit('error', { msg: 'Conversation not found' });
          return;
        }

        console.log('✅ Conversation found:', { 
          _id: conversation._id, 
          conversationId: conversation.conversationId,
          jobId: conversation.jobId 
        });

        // Check authorization
        const employerId = extractEntityId(conversation.employerId);
        const workerId = extractEntityId(conversation.workerId);
        const isEmployer = employerId === userId;
        const isWorker = workerId === userId;
        if (!isEmployer && !isWorker) {
          socket.emit('error', { msg: 'Not authorized' });
          return;
        }

        console.log('✅ User authorized:', { userId, isEmployer, isWorker });

        // Check if blocked
        const receiverId = isEmployer ? workerId : employerId;
        const blockCheck = await BlockedUser.findOne({
          $or: [
            { blockerId: userId, blockedId: receiverId },
            { blockerId: receiverId, blockedId: userId },
          ],
        });

        if (blockCheck) {
          socket.emit('error', { msg: 'Cannot send message: conversation blocked' });
          return;
        }

        // Create message - use conversation's conversationId for consistency
        const newMessage = new Message({
          conversationId: conversation.conversationId || conversation._id.toString(),
          jobId: conversation.jobId,
          employerId: conversation.employerId,
          workerId: conversation.workerId,
          senderId: userId,
          receiverId,
          type: normalizedPayload.type,
          content: normalizedPayload.content,
          message: normalizedPayload.message,
          attachments: normalizedPayload.attachments,
          fileUrl: normalizedPayload.fileUrl,
          fileName: normalizedPayload.fileName,
          fileSize: normalizedPayload.fileSize,
          isRead: false,
        });

        await newMessage.save();
        console.log('✅ Message saved to DB:', { _id: newMessage._id, conversationId: newMessage.conversationId });

        // Update conversation
        conversation.lastMessage = {
          text: buildLastMessagePreview(normalizedPayload),
          senderId: userId,
          timestamp: new Date(),
        };
        conversation.lastMessageId = newMessage._id;

        // Increment unread for receiver
        if (isEmployer) {
          conversation.workerUnreadCount += 1;
        } else {
          conversation.employerUnreadCount += 1;
        }
        conversation.updatedAt = new Date();
        await conversation.save();

        // Populate sender details
        await newMessage.populate('senderId', 'name profilePhoto role email');

        // Emit message to room using conversation ID
        const roomName = conversation.conversationId || conversation._id.toString();
        
        // Build full message object with populated sender
        const messageToEmit = {
          _id: newMessage._id,
          conversationId: newMessage.conversationId,
          senderId: newMessage.senderId,  // Now includes name, profilePhoto, etc.
          type: newMessage.type,
          content: newMessage.content,
          fileUrl: newMessage.fileUrl,
          fileName: newMessage.fileName,
          fileSize: newMessage.fileSize,
          message: newMessage.message,
          attachments: newMessage.attachments,
          isRead: newMessage.isRead,
          readAt: newMessage.readAt,
          createdAt: newMessage.createdAt,
          status: 'delivered',
        };
        
        console.log('📢 Broadcasting messageReceived to room:', roomName);
        console.log('   Message:', messageToEmit);
        io.to(roomName).emit('messageReceived', messageToEmit);

        // Also emit via conversationId in case room name is different
        if (conversation._id.toString() !== roomName) {
          console.log('📢 Also broadcasting to alternate room:', conversation._id.toString());
          io.to(conversation._id.toString()).emit('messageReceived', messageToEmit);
        }

        // Emit conversation update to both users (for sidebar updates)
        const conversationUpdate = {
          _id: conversation._id,
          conversationId: conversation.conversationId,
          jobId: conversation.jobId,
          lastMessage: conversation.lastMessage,
          lastMessageId: conversation.lastMessageId,
          updatedAt: conversation.updatedAt,
          employerId: conversation.employerId,
          workerId: conversation.workerId,
          employerUnreadCount: conversation.employerUnreadCount,
          workerUnreadCount: conversation.workerUnreadCount,
        };

        // Emit to both users to update their conversation list
        if (employerId) {
          io.to(employerId).emit('conversationUpdated', conversationUpdate);
        }
        if (workerId) {
          io.to(workerId).emit('conversationUpdated', conversationUpdate);
        }

        // Clear typing indicator
        if (typingUsers[roomName]) {
          typingUsers[roomName] = typingUsers[roomName].filter(
            (id) => id !== userId
          );
        }

        // Emit unread count to receiver if offline
        if (connectedUsers[receiverId]) {
          // User is online but maybe not in this room
          io.to(connectedUsers[receiverId].socketId).emit('unreadCountUpdated', {
            unreadCount: employerId === receiverId
              ? conversation.employerUnreadCount
              : conversation.workerUnreadCount,
            conversationId: roomName,
          });
        }
      } catch (err) {
        console.error('❌ Error in sendMessage:', err);
        socket.emit('error', { msg: 'Error sending message', error: err.message });
      }
    });

    // ===========================
    // TYPING INDICATOR
    // ===========================

    /**
     * typing:start - User starts typing
     * Data: { conversationId }
     */
    socket.on('typing:start', ({ conversationId }) => {
      try {
        if (!typingUsers[conversationId]) {
          typingUsers[conversationId] = [];
        }

        if (!typingUsers[conversationId].includes(userId)) {
          typingUsers[conversationId].push(userId);
        }

        // Broadcast to others in room
        socket.to(conversationId).emit('typing:start', {
          userId,
          conversationId,
        });

        // Auto-stop after 3 seconds if no new event
        setTimeout(() => {
          if (
            typingUsers[conversationId] &&
            typingUsers[conversationId].includes(userId)
          ) {
            typingUsers[conversationId] = typingUsers[conversationId].filter(
              (id) => id !== userId
            );
            socket.to(conversationId).emit('typing:stop', {
              userId,
              conversationId,
            });
          }
        }, 3000);
      } catch (err) {
        console.error('Error in typing:start:', err);
        socket.emit('error', { msg: 'Error with typing indicator', error: err.message });
      }
    });

    /**
     * typing:stop - User stops typing
     * Data: { conversationId }
     */
    socket.on('typing:stop', ({ conversationId }) => {
      try {
        if (typingUsers[conversationId]) {
          typingUsers[conversationId] = typingUsers[conversationId].filter(
            (id) => id !== userId
          );
        }

        socket.to(conversationId).emit('typing:stop', {
          userId,
          conversationId,
        });
      } catch (err) {
        console.error('Error in typing:stop:', err);
        socket.emit('error', { msg: 'Error stopping typing indicator', error: err.message });
      }
    });

    // ===========================
    // MESSAGE READ RECEIPT
    // ===========================

    /**
     * message:read - User reads messages
     * Data: { conversationId, messageIds }
     */
    socket.on('message:read', async ({ conversationId, messageIds }) => {
      try {
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
          return;
        }

        // Update messages
        const result = await Message.updateMany(
          {
            _id: { $in: messageIds },
            receiverId: userId,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // Broadcast read status to room
        socket.to(conversationId).emit('message:read', {
          userId,
          conversationId,
          messageIds,
          readAt: new Date(),
        });
      } catch (err) {
        console.error('Error in message:read:', err);
        socket.emit('error', { msg: 'Error marking messages as read', error: err.message });
      }
    });

    // ===========================
    // DISCONNECTION
    // ===========================

    socket.on('disconnect', async () => {
      try {
        // Get user's room before deletion
        const room = connectedUsers[userId]?.room;

        // Remove user from connected users
        delete connectedUsers[userId];

        // Clean up typing users
        if (room && typingUsers[room]) {
          typingUsers[room] = typingUsers[room].filter((id) => id !== userId);
        }

        // Broadcast user offline
        if (room) {
          io.to(room).emit('userLeftRoom', {
            userId,
            status: 'offline',
            leftAt: new Date(),
          });
        }

        socket.broadcast.emit('userOffline', {
          userId,
          status: 'offline',
          leftAt: new Date(),
        });

        console.log(`User ${userId} disconnected`);
      } catch (err) {
        console.error('Error in disconnect:', err);
      }
    });

    // ===========================
    // ERROR HANDLING
    // ===========================

    socket.on('error', (err) => {
      console.error('Socket error for user', userId, ':', err);
    });
  });
};
