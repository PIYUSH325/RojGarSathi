const express = require('express');
const chatController = require('../controllers/chatController');
const authenticateUser = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadChatMedia } = require('../middleware/chatUpload');

const router = express.Router();
const uploadMediaFields = uploadChatMedia.fields([
  { name: 'file', maxCount: 1 },
  { name: 'attachment', maxCount: 1 },
]);

// Selective auth: public GET for load, protected POST/DELETE
// router.use(authenticateUser); // Removed for public GET access to conversations
// Auth applied per-route for POST/DELETE


// ===========================
// CONVERSATION ROUTES
// ===========================

/**
 * GET /api/v1/chat/conversation/:jobId
 * Get or create conversation for a specific job
 * Query params: ?workerId=<id> (for employers)
 */
router.get(
  '/conversation/:jobId',
  chatController.getOrCreateConversation
);

/**
 * GET /api/v1/chat/conversations
 * Get all conversations for current user
 * Query params: ?limit=20&skip=0
 * Auth: Required
 */
router.get('/conversations', authenticateUser, chatController.getUserConversations);

/**
 * GET /api/v1/chat/conversations/search
 * Search conversations by job title or user name
 * Query params: ?query=<search_term>
 * Auth: Required
 */
router.get('/conversations/search', authenticateUser, chatController.searchConversations);

// ===========================
// MESSAGE ROUTES
// ===========================

/**
 * POST /api/v1/chat/message/:conversationId
 * Send a message or inquiry
 * Body: { message: string, attachments?: Array, senderName?: string, senderEmail?: string, jobId?: string }
 * Auth: Optional (required for authenticated messaging, not required for anonymous inquiries)
 */
router.post('/message/:conversationId', optionalAuth, chatController.sendMessage);

/**
 * GET /api/v1/chat/history/:conversationId
 * Get chat history with pagination
 * Query params: ?limit=50&skip=0
 * Auth: Optional (inside controller)
 */
router.get('/history/:conversationId', optionalAuth, chatController.getChatHistory);

/**
 * GET /api/v1/chat/history/:conversationId/search
 * Search messages in conversation
 * Query params: ?query=<search_term>
 */
router.get('/history/:conversationId/search', chatController.searchMessages);

/**
 * PATCH /api/v1/chat/read/:conversationId
 * Mark all messages in conversation as read
 * Auth: Required
 */
router.patch('/read/:conversationId', authenticateUser, chatController.markMessagesAsRead);

/**
 * DELETE /api/v1/chat/message/:messageId
 * Delete a message (soft delete)
 * Auth: Required
 */
router.delete('/message/:messageId', authenticateUser, chatController.deleteMessage);

// ===========================
// BLOCKING ROUTES
// ===========================

/**
 * POST /api/v1/chat/block
 * Block a user
 * Body: { blockedId: string, reason?: string, reasonDetails?: string }
 * Auth: Required
 */
router.post('/block', authenticateUser, chatController.blockUser);

/**
 * DELETE /api/v1/chat/block/:blockedId
 * Unblock a user
 * Auth: Required
 */
router.delete('/block/:blockedId', authenticateUser, chatController.unblockUser);

/**
 * GET /api/v1/chat/blocked-users
 * Get list of blocked users
 */
router.get('/blocked-users', chatController.getBlockedUsers);

// ===========================
// REPORTING ROUTES
// ===========================

/**
 * POST /api/v1/chat/report
 * Report a user for abuse
 * Body: { reportedUserId: string, conversationId?: string, messageId?: string, reason: string, description: string }
 * Auth: Required
 */
router.post('/report', authenticateUser, chatController.reportAbuse);

// ===========================
// MUTE / UNMUTE ROUTES
// ===========================

/**
 * PUT /api/v1/chat/mute/:conversationId
 * Mute a conversation (suppress notifications)
 * Auth: Required
 */
router.put('/mute/:conversationId', authenticateUser, chatController.muteConversation);

/**
 * PUT /api/v1/chat/unmute/:conversationId
 * Unmute a conversation
 * Auth: Required
 */
router.put('/unmute/:conversationId', authenticateUser, chatController.unmuteConversation);

// ===========================
// CLEAR CHAT ROUTE
// ===========================

/**
 * DELETE /api/v1/chat/clear/:conversationId
 * Clear all messages in a conversation
 * Auth: Required
 */
router.delete('/clear/:conversationId', authenticateUser, chatController.clearChat);

/**
 * DELETE /api/v1/chat/delete/:conversationId
 * Delete entire conversation and all messages
 * Auth: Required
 */
router.delete('/delete/:conversationId', authenticateUser, chatController.deleteConversation);

// ===========================

/**
 * GET /api/v1/chat/unread-count
 * Get total unread message count
 * Auth: Required
 */
router.get('/unread-count', authenticateUser, chatController.getUnreadCount);

// ===========================
// FILE UPLOAD ROUTES
// ===========================

/**
 * POST /api/v1/chat/upload
 * Upload a chat media file (image/video/audio/pdf)
 * Returns: { success: true, type, fileUrl, fileName, fileSize, mimeType }
 * Auth: Required
 */
router.post('/upload', authenticateUser, uploadMediaFields, chatController.uploadMessageMedia);

// Backward-compatible alias for older frontend builds.
router.post('/upload-attachment', authenticateUser, uploadMediaFields, chatController.uploadMessageMedia);

module.exports = router;
