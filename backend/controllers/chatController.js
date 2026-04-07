const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');
const ReportAbuse = require('../models/ReportAbuse');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Contact = require('../models/Contact');
const { StatusCodes } = require('http-status-codes');

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

const getEntityIdString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (typeof value.toString === 'function') return String(value.toString());
  return '';
};

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

exports.uploadMessageMedia = async (req, res) => {
  try {
    const uploadedFile =
      req.file ||
      req.files?.file?.[0] ||
      req.files?.attachment?.[0] ||
      null;

    if (!uploadedFile) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'No file uploaded',
      });
    }

    const mimeType = uploadedFile.mimetype || '';
    let type = 'text';
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.startsWith('video/')) type = 'video';
    else if (mimeType.startsWith('audio/')) type = 'audio';
    else if (mimeType === 'application/pdf') type = 'pdf';

    if (!VALID_MESSAGE_TYPES.has(type) || type === 'text') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Unsupported file type',
      });
    }

    const relativePath = uploadedFile.path
      .replace(/\\/g, '/')
      .replace(/^.*\/uploads\//, 'uploads/');

    return res.status(StatusCodes.OK).json({
      success: true,
      type,
      fileUrl: `/${relativePath}`,
      fileName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      mimeType,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to upload media',
      error: error.message,
    });
  }
};

// ===========================
// CONVERSATION MANAGEMENT
// ===========================

/**
 * Get or create conversation between employer and worker for a job
 */
exports.getOrCreateConversation = async (req, res) => {
  const { jobId } = req.params;
  
  // Try to extract user from auth header
  let userId = req.user?.id;
  if (!userId && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // Support both token formats (id or userId)
      userId = payload.id || payload.userId || null;
    } catch (err) {
      // Token invalid - continue as anonymous
    }
  }
  
  try {
    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Job not found' });
    }

    // If authenticated, get or create real conversation
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: 'User not found' });
      }

      const requestedTargetUserId =
        req.query.targetUserId || req.query.workerId || req.query.userId;

      let targetUserId = requestedTargetUserId;
      if (!targetUserId) {
        // Default to job owner when the requester is not the job owner.
        if (job.postedBy?.toString() !== userId.toString()) {
          targetUserId = job.postedBy.toString();
        }
      }

      if (!targetUserId || targetUserId.toString() === userId.toString()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Select a valid user to start conversation',
        });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Target user not found' });
      }

      let employerId;
      let workerId;
      if (user.role === 'employer' && targetUser.role === 'worker') {
        employerId = userId;
        workerId = targetUserId;
      } else if (user.role === 'worker' && targetUser.role === 'employer') {
        employerId = targetUserId;
        workerId = userId;
      } else {
        // If both users share the same role, use a deterministic ordering.
        const [firstId, secondId] = [userId.toString(), targetUserId.toString()].sort();
        employerId = firstId;
        workerId = secondId;
      }

      // Generate consistent conversationId
      const conversationId = [employerId, workerId, jobId].sort().join('-');

      // Look up or create conversation
      let conversation = await Conversation.findOne({ conversationId });
      
      if (!conversation) {
        conversation = await Conversation.create({
          conversationId,
          jobId,
          employerId,
          workerId,
        });
        await conversation.populate('jobId employerId workerId');
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        conversation,
      });
    }

    // For anonymous users, return a temporary conversation object
    // This allows anonymous users to browse chat history and send inquiries
    const tempConversationId = `anonymous-job-${jobId}`;
    const tempConversation = {
      _id: tempConversationId,
      conversationId: tempConversationId,
      jobId,
      isAnonymous: true,
    };

    res.status(StatusCodes.OK).json({
      success: true,
      conversation: tempConversation,
    });
  } catch (err) {
    console.error('Error in getOrCreateConversation:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error loading chat', error: err.message });
  }
};

/**
 * Get all conversations for current user
 */
exports.getUserConversations = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.OK).json({
      success: true,
      conversations: [],
      total: 0,
    });
  }
  const userId = req.user.id;
  const { limit = 20, skip = 0 } = req.query;

  try {
    const filter = {
      isActive: true,
      $or: [{ employerId: userId }, { workerId: userId }],
    };

    const conversations = await Conversation.find(filter)
      .populate('employerId', 'name profilePhoto email role')
      .populate('workerId', 'name profilePhoto email role')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await Conversation.countDocuments(filter);

    res.status(StatusCodes.OK).json({
      success: true,
      conversations,
      total: totalCount,
    });
  } catch (err) {
    console.error('Error in getUserConversations:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error fetching conversations' });
  }
};

/**
 * Search conversations by job title or user name
 */
exports.searchConversations = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.OK).json({
      success: true,
      conversations: [],
    });
  }
  const userId = req.user.id;
  const { query } = req.query;

  try {
    if (!query || query.trim() === '') {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Search query is required' });
    }

    const filter = {
      isActive: true,
      $or: [{ employerId: userId }, { workerId: userId }],
    };

    const searchRegex = new RegExp(query, 'i');

    const conversations = await Conversation.find(filter)
      .populate({
        path: 'jobId',
        match: { title: searchRegex },
      })
      .populate('employerId', 'name profilePhoto email role')
      .populate('workerId', 'name profilePhoto email role');

    // Filter conversations where either job or user matched
    const filtered = conversations.filter((conv) => {
      const jobMatched = conv.jobId !== null;
      const employerId = conv.employerId?._id?.toString() || conv.employerId?.toString();
      const workerId = conv.workerId?._id?.toString() || conv.workerId?.toString();
      const otherUser = employerId === userId.toString() ? conv.workerId : conv.employerId;
      const userMatched = otherUser?.name?.match(searchRegex);
      return jobMatched || userMatched;
    });

    res.status(StatusCodes.OK).json({
      success: true,
      conversations: filtered,
    });
  } catch (err) {
    console.error('Error in searchConversations:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error searching conversations' });
  }
};

// ===========================
// MESSAGE MANAGEMENT
// ===========================

/**
 * Send a message
 */
exports.sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const {
    message,
    content,
    type,
    attachments = [],
    jobId,
    senderName = '',
    senderEmail = '',
  } = req.body;
  const senderId = req.user?.id;

  console.log('📨 sendMessage called with:', { conversationId, message: message?.substring(0, 50), senderId, jobId });

  try {
    const normalizedPayload = normalizeMessagePayload({ message, content, type, attachments });

    if (!normalizedPayload.content && normalizedPayload.attachments.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Message content or media attachment is required' });
    }

    if (!normalizedPayload.type) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Message type is invalid' });
    }

    // ===== HANDLE ANONYMOUS INQUIRY =====
    if (!senderId) {
      console.log('👤 Handling anonymous inquiry');
      // Validate contact information for anonymous users
      if (!senderName || !senderEmail) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: 'Name and email are required for inquiries' });
      }

      // Create a Contact record for anonymous inquiry
      const newContact = new Contact({
        name: senderName.trim(),
        email: senderEmail.trim(),
        subject: `Job Inquiry - ${jobId}`,
        message: normalizedPayload.content,
        status: 'unread',
      });

      await newContact.save();

      return res.status(StatusCodes.CREATED).json({
        success: true,
        contact: newContact,
        msg: 'Your inquiry has been sent successfully! We will get back to you soon.',
        isContact: true,
      });
    }

    // ===== HANDLE AUTHENTICATED MESSAGE =====
    console.log('🔐 Handling authenticated message for senderId:', senderId);
    // Find conversation by either _id or conversationId field without forcing invalid ObjectId casts
    const conversationLookup = buildConversationLookupQuery(conversationId);
    const conversation = conversationLookup
      ? await Conversation.findOne(conversationLookup)
      : null;

    if (!conversation) {
      console.log('❌ Conversation not found:', conversationId);
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    console.log('✓ Conversation found:', { convoId: conversation._id, employerId: conversation.employerId, workerId: conversation.workerId });

    // Extract IDs from populated objects early (Conversation auto-populates these)
    const conversationEmployerId = conversation.employerId?._id || conversation.employerId;
    const conversationWorkerId = conversation.workerId?._id || conversation.workerId;

    // Verify user is part of this conversation
    const isEmployer = conversationEmployerId?.toString() === senderId.toString();
    const isWorker = conversationWorkerId?.toString() === senderId.toString();
    console.log('👥 Authorization check:', { isEmployer, isWorker, senderId, employerId: conversationEmployerId?.toString(), workerId: conversationWorkerId?.toString() });
    
    if (!isEmployer && !isWorker) {
      console.log('❌ Unauthorized - user not part of conversation');
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized to send messages in this conversation' });
    }

    // Check if sender has blocked receiver or vice versa
    const receiverId = isEmployer ? conversationWorkerId : conversationEmployerId;
    console.log('📍 Receiver ID:', receiverId);
    
    const blockCheck = await BlockedUser.findOne({
      $or: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    });

    if (blockCheck) {
      console.log('🚫 Conversation is blocked');
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Cannot send message: conversation is blocked',
      });
    }

    // Extract IDs from populated objects (Conversation auto-populates these)
    const jobId = conversation.jobId?._id || conversation.jobId;

    // Create message - use conversation's conversationId string for consistency
    const newMessage = new Message({
      conversationId: conversation.conversationId || conversation._id.toString(),
      jobId: jobId,
      employerId: conversationEmployerId,
      workerId: conversationWorkerId,
      senderId,
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

    console.log('💾 Saving message with:', { conversationId: newMessage.conversationId, jobId: newMessage.jobId, senderId, receiverId });
    await newMessage.save();
    console.log('✅ Message saved successfully:', newMessage._id);

    // Update conversation's last message
    conversation.lastMessage = {
      text: buildLastMessagePreview(normalizedPayload),
      senderId,
      timestamp: new Date(),
    };
    conversation.lastMessageId = newMessage._id;

    // Increment unread count for receiver
    if (isEmployer) {
      conversation.workerUnreadCount += 1;
    } else {
      conversation.employerUnreadCount += 1;
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender details
    await newMessage.populate('senderId', 'name profilePhoto role');
    await newMessage.populate('receiverId', 'name profilePhoto role');

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: newMessage,
      msg: 'Message sent successfully!'
    });
  } catch (err) {
    console.error('❌ Error in sendMessage:', err.message);
    console.error('Stack:', err.stack);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error sending message', error: err.message });
  }
};

/**
 * Get chat history with pagination
 */
exports.getChatHistory = async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 50, skip = 0 } = req.query;
  
  // Get userId from optionalAuth middleware or manual extraction as fallback
  let userId = req.user?.id;
  
  if (!userId && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // Support both token payload formats
      userId = payload.id || payload.userId || null;
    } catch (err) {
      // Token invalid or expired - continue as unauthenticated
      console.log('⚠️  Token extraction failed:', err.message);
    }
  }

  try {
    if (!conversationId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Conversation ID is required'
      });
    }

    console.log('📨 getChatHistory called:', { conversationId, userId, limit, skip });

    // Check if this is an anonymous conversation ID (format: anonymous-job-{jobId})
    if (conversationId.startsWith('anonymous-job-')) {
      console.log('👤 Anonymous conversation requested');
      // Return empty chat history for anonymous users
      return res.status(StatusCodes.OK).json({
        success: true,
        messages: [],
        total: 0,
        conversation: {
          _id: conversationId,
          conversationId,
          isAnonymous: true,
        }
      });
    }

    // Find conversation by conversationId string field (don't try to cast to ObjectId)
    const conversation = await Conversation.findOne({
      conversationId: conversationId
    });

    if (!conversation) {
      console.log('❌ Conversation not found for ID:', conversationId);
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    console.log('✓ Conversation found:', { convoId: conversation._id, employerId: conversation.employerId?.toString(), workerId: conversation.workerId?.toString(), userId });

    // If authenticated, verify user is part of conversation
    if (userId) {
      // Handle both populated and non-populated objects
      const employerId = conversation.employerId?._id || conversation.employerId;
      const workerId = conversation.workerId?._id || conversation.workerId;
      
      const isEmployer = employerId?.toString() === userId.toString();
      const isWorker = workerId?.toString() === userId.toString();
      
      console.log('👥 Authorization check:', { isEmployer, isWorker });
      
      if (!isEmployer && !isWorker) {
        console.log('❌ Forbidden - user not part of conversation');
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ msg: 'Not authorized to view this conversation' });
      }
      
      // Mark as read for authenticated user
      const userRole = isEmployer ? 'employer' : 'worker';
      const markAsReadKey = userRole === 'employer' ? 'employerUnreadCount' : 'workerUnreadCount';
      if (conversation[markAsReadKey] > 0) {
        conversation[markAsReadKey] = 0;
        await conversation.save();
        console.log('✓ Marked as read for', userRole);
      }
    }

    // Fetch messages - filter by conversationId and exclude deleted messages
    const query = {
      conversationId: conversation.conversationId || conversation._id.toString(),
      isDeleted: false
    };
    
    console.log('📩 Fetching messages with query:', query);
    
    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('senderId', 'name profilePhoto role')
      .populate('receiverId', 'name profilePhoto role');

    console.log(`✅ Found ${messages.length} messages for conversation`);

    const totalCount = await Message.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      messages,
      total: totalCount,
      conversation,
    });
  } catch (err) {
    console.error('Error in getChatHistory:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error fetching chat history', error: err.message });
  }
};


/**
 * Search messages in a conversation
 */
exports.searchMessages = async (req, res) => {
  const { conversationId } = req.params;
  const { query } = req.query;
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;

  try {
    if (!query || query.trim() === '') {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Search query is required' });
    }

    // Find conversation and verify access
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    const isEmployer = conversation.employerId.equals(userId);
    const isWorker = conversation.workerId.equals(userId);
    if (!isEmployer && !isWorker) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized to search this conversation' });
    }

    const searchRegex = new RegExp(query, 'i');
    const messages = await Message.find({
      conversationId,
      message: searchRegex,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name profilePhoto');

    res.status(StatusCodes.OK).json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (err) {
    console.error('Error in searchMessages:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error searching messages' });
  }
};

/**
 * Mark messages as read
 */
exports.markMessagesAsRead = async (req, res) => {
  const { conversationId } = req.params;
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    // Verify access
    const isEmployer = conversation.employerId.equals(userId);
    const isWorker = conversation.workerId.equals(userId);
    if (!isEmployer && !isWorker) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized' });
    }

    // Mark all receiver's unread messages as read
    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count
    if (isEmployer) {
      conversation.employerUnreadCount = 0;
    } else {
      conversation.workerUnreadCount = 0;
    }
    await conversation.save();

    res.status(StatusCodes.OK).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('Error in markMessagesAsRead:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error marking messages as read' });
  }
};

/**
 * Delete a message (soft delete)
 */
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Message not found' });
    }

    // Only sender can delete their message
    if (!message.senderId.equals(userId)) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized to delete this message' });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.message = '[Message deleted]';
    await message.save();

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Message deleted',
    });
  } catch (err) {
    console.error('Error in deleteMessage:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error deleting message' });
  }
};

// ===========================
// BLOCKING & SAFETY
// ===========================

/**
 * Block a user
 */
exports.blockUser = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const blockerId = req.user.id;
  const { blockedId, reason = 'other', reasonDetails = '' } = req.body;

  try {
    if (!blockedId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'User ID to block is required' });
    }

    if (blockerId === blockedId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'You cannot block yourself' });
    }

    // Check if already blocked
    let blocked = await BlockedUser.findOne({
      blockerId,
      blockedId,
    });

    if (blocked) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'User is already blocked' });
    }

    // Create block
    blocked = await BlockedUser.create({
      blockerId,
      blockedId,
      reason,
      reasonDetails,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: 'User blocked successfully',
      blocked,
    });
  } catch (err) {
    console.error('Error in blockUser:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error blocking user' });
  }
};

/**
 * Unblock a user
 */
exports.unblockUser = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const blockerId = req.user.id;
  const { blockedId } = req.params;

  try {
    const blocked = await BlockedUser.findOneAndDelete({
      blockerId,
      blockedId,
    });

    if (!blocked) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Block record not found' });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'User unblocked successfully',
    });
  } catch (err) {
    console.error('Error in unblockUser:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error unblocking user' });
  }
};

/**
 * Get blocked users list
 */
exports.getBlockedUsers = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;

  try {
    const blockedUsers = await BlockedUser.find({
      blockerId: userId,
    }).populate('blockedId', 'name email profilePhoto role');

    res.status(StatusCodes.OK).json({
      success: true,
      blockedUsers,
    });
  } catch (err) {
    console.error('Error in getBlockedUsers:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error fetching blocked users' });
  }
};

// ===========================
// REPORTING & ABUSE
// ===========================

/**
 * Report a user for abuse
 */
exports.reportAbuse = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const reporterId = req.user.id;
  const { reportedUserId, conversationId, messageId, reason, description } =
    req.body;

  try {
    if (!reportedUserId || !reason || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Reported user ID, reason, and description are required',
      });
    }

    if (reporterId === reportedUserId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'You cannot report yourself' });
    }

    // Check for duplicate report within 24 hours
    const existingReport = await ReportAbuse.findOne({
      reporterId,
      reportedUserId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existingReport) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'You have already reported this user in the last 24 hours',
      });
    }

    // Create report
    const report = await ReportAbuse.create({
      reporterId,
      reportedUserId,
      conversationId,
      messageId,
      reason,
      description,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: 'Report submitted successfully',
      report,
    });
  } catch (err) {
    console.error('Error in reportAbuse:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error submitting report' });
  }
};

/**
 * Get unread message count for current user
 */
exports.getUnreadCount = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.OK).json({
      success: true,
      unreadCount: 0,
    });
  }
  const userId = req.user.id;

  try {
    const userRole = req.user.role;
    let filter = {};

    if (userRole === 'employer') {
      filter = { employerId: userId };
    } else if (userRole === 'worker') {
      filter = { workerId: userId };
    }

    const conversations = await Conversation.find(filter);

    const totalUnread = conversations.reduce((sum, conv) => {
      const unreadForUser =
        userRole === 'employer'
          ? conv.employerUnreadCount
          : conv.workerUnreadCount;
      return sum + unreadForUser;
    }, 0);

    res.status(StatusCodes.OK).json({
      success: true,
      unreadCount: totalUnread,
    });
  } catch (err) {
    console.error('Error in getUnreadCount:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error fetching unread count' });
  }
};

// ===========================
// MUTE / UNMUTE CONVERSATION
// ===========================

/**
 * Mute a conversation (suppress notifications)
 */
exports.muteConversation = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    // Verify user is part of conversation
    const isEmployer = conversation.employerId.equals(userId);
    const isWorker = conversation.workerId.equals(userId);
    if (!isEmployer && !isWorker) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized' });
    }

    // Mute conversation for this user
    if (isEmployer) {
      conversation.employerMuted = true;
    } else {
      conversation.workerMuted = true;
    }

    await conversation.save();

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Conversation muted successfully',
      conversation,
    });
  } catch (err) {
    console.error('Error in muteConversation:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error muting conversation' });
  }
};

/**
 * Unmute a conversation
 */
exports.unmuteConversation = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    // Verify user is part of conversation
    const isEmployer = conversation.employerId.equals(userId);
    const isWorker = conversation.workerId.equals(userId);
    if (!isEmployer && !isWorker) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized' });
    }

    // Unmute conversation for this user
    if (isEmployer) {
      conversation.employerMuted = false;
    } else {
      conversation.workerMuted = false;
    }

    await conversation.save();

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Conversation unmuted successfully',
      conversation,
    });
  } catch (err) {
    console.error('Error in unmuteConversation:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error unmuting conversation' });
  }
};

// ===========================
// CLEAR CHAT
// ===========================

/**
 * Clear all messages in a conversation (delete for current user)
 * Soft deletes all messages - they are hidden but not actually removed
 */
exports.clearChat = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;
  const { conversationId } = req.params;

  try {
    const conversationLookup = buildConversationLookupQuery(conversationId);
    const conversation = conversationLookup
      ? await Conversation.findOne(conversationLookup)
      : null;
    if (!conversation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    // Verify user is part of conversation (works for populated and raw ObjectId fields)
    const employerId = getEntityIdString(conversation.employerId);
    const workerId = getEntityIdString(conversation.workerId);
    const isEmployer = employerId === String(userId);
    const isWorker = workerId === String(userId);
    if (!isEmployer && !isWorker) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized' });
    }

    // Soft delete all messages sent by the other party
    const receiverId = isEmployer ? workerId : employerId;

    const result = await Message.updateMany(
      {
        conversationId: conversation.conversationId || conversation._id.toString(),
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        message: '[Message deleted]',
      }
    );

    // Reset conversation state
    conversation.lastMessage = null;
    conversation.lastMessageId = null;
    if (isEmployer) {
      conversation.employerUnreadCount = 0;
    } else {
      conversation.workerUnreadCount = 0;
    }
    await conversation.save();

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Chat cleared successfully',
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('Error in clearChat:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error clearing chat' });
  }
};

// ===========================
// DELETE CONVERSATION
// ===========================

/**
 * Delete entire conversation and all messages
 * Hard deletes the conversation and all associated messages
 */
exports.deleteConversation = async (req, res) => {
  if (!req.user?.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
  }
  const userId = req.user.id;
  const { conversationId } = req.params;

  try {
    const conversationLookup = buildConversationLookupQuery(conversationId);
    const conversation = conversationLookup
      ? await Conversation.findOne(conversationLookup)
      : null;
    if (!conversation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Conversation not found' });
    }

    // Verify user is part of conversation (works for populated and raw ObjectId fields)
    const employerId = getEntityIdString(conversation.employerId);
    const workerId = getEntityIdString(conversation.workerId);
    const isEmployer = employerId === String(userId);
    const isWorker = workerId === String(userId);
    if (!isEmployer && !isWorker) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Not authorized' });
    }

    // Determine the other party
    const otherUserId = isEmployer ? workerId : employerId;

    // Automatically unblock the other user if they were blocked
    await BlockedUser.findOneAndDelete({
      blockerId: userId,
      blockedId: otherUserId,
    });

    // Delete all messages in this conversation
    const deleteResult = await Message.deleteMany({
      conversationId: conversation.conversationId || conversation._id.toString(),
    });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversation._id);

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Conversation deleted successfully',
      deletedMessagesCount: deleteResult.deletedCount,
    });
  } catch (err) {
    console.error('Error in deleteConversation:', err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Error deleting conversation' });
  }
};
