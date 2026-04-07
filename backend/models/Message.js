const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'pdf'],
      default: 'text',
      index: true,
    },
    content: {
      type: String,
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
      trim: true,
      default: '',
    },
    message: {
      type: String,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'pdf', 'document', 'archive', 'presentation', 'spreadsheet', 'other'],
          default: 'other',
        },
        name: String,
        size: Number, // in bytes
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    indexes: [
      { conversationId: 1, createdAt: -1 },
      { jobId: 1, createdAt: -1 },
      { senderId: 1, createdAt: -1 },
      { receiverId: 1, createdAt: -1 },
      { isRead: 1, receiverId: 1 },
    ],
  }
);

// Populate references before returning
MessageSchema.pre(/^find/, function () {
  this.populate({
    path: 'senderId',
    select: 'name profilePhoto role',
  }).populate({
    path: 'receiverId',
    select: 'name profilePhoto role',
  });
});

module.exports = mongoose.model('Message', MessageSchema);
