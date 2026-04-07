const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name'],
        trim: true,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide a valid email'],
    },
    subject: {
        type: String,
        required: [true, 'Please provide subject'],
        trim: true,
        maxlength: 100,
    },
    message: {
        type: String,
        required: [true, 'Please provide message'],
        trim: true,
        maxlength: 1000,
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied', 'spam'],
        default: 'unread',
    },
    adminReply: {
        type: String,
        default: '',
        maxlength: 1000,
    },
    repliedAt: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);
