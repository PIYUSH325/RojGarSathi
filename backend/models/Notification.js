const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['user_registration', 'job_application', 'job_posted', 'application_status_update', 'system_alert', 'error'],
    },
    title: {
        type: String,
        required: true,
        maxlength: 100,
    },
    message: {
        type: String,
        required: true,
        maxlength: 500,
    },
    recipient: {
        type: String,
        enum: ['admin', 'all', 'user'],
        default: 'admin',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.recipient === 'user';
        }
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel',
    },
    relatedModel: {
        type: String,
        enum: ['User', 'Job', 'Application'],
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
