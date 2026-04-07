const Notification = require('../models/Notification');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../errors');

// [GET] /api/v1/notifications - Get user's notifications
const getUserNotifications = async (req, res) => {
    if (!req.user?.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
    }
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.id };
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    res.status(StatusCodes.OK).json({
        notifications,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalNotifications / limit),
            totalNotifications,
            hasNext: page * limit < totalNotifications,
            hasPrev: page > 1
        },
        unreadCount
    });
};

// [PUT] /api/v1/notifications/:id/read - Mark notification as read
const markNotificationRead = async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new NotFoundError('Notification not found');
    }

    res.status(StatusCodes.OK).json({
        notification,
        msg: 'Notification marked as read'
    });
};

// [PUT] /api/v1/notifications/mark-all-read - Mark all user notifications as read
const markAllNotificationsRead = async (req, res) => {
    await Notification.updateMany(
        { userId: req.user.id, isRead: false },
        { isRead: true }
    );

    res.status(StatusCodes.OK).json({
        msg: 'All notifications marked as read'
    });
};

// Helper function to create notifications
const createNotification = async (type, title, message, userId, relatedId = null, relatedModel = null, priority = 'medium') => {
    try {
        const notification = await Notification.create({
            type,
            title,
            message,
            recipient: 'user',
            userId,
            relatedId,
            relatedModel,
            priority
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw error to avoid breaking main functionality
    }
};

module.exports = {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createNotification
};
