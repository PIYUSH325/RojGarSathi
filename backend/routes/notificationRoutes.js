const express = require('express');
const router = express.Router();
const {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead
} = require('../controllers/notificationController');
const authenticateUser = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticateUser);

// [GET] /api/v1/notifications - Get user's notifications
router.get('/', getUserNotifications);

// [PUT] /api/v1/notifications/:id/read - Mark notification as read
router.put('/:id/read', markNotificationRead);

// [PUT] /api/v1/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsRead);

module.exports = router;
