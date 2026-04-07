const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: [true, 'Conversation ID is required'],
      unique: true,
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
    lastMessage: {
      text: String,
      senderId: mongoose.Schema.Types.ObjectId,
      timestamp: Date,
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    employerUnreadCount: {
      type: Number,
      default: 0,
    },
    workerUnreadCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicationStatus: {
      type: String,
      enum: ['applied', 'selected', 'rejected', 'interview', 'offer', 'closed'],
      default: 'applied',
    },
    employerMuted: {
      type: Boolean,
      default: false,
    },
    workerMuted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { employerId: 1, createdAt: -1 },
      { workerId: 1, createdAt: -1 },
      { jobId: 1 },
    ],
  }
);

// Populate references
ConversationSchema.pre(/^find/, function () {
  this.populate({
    path: 'jobId',
    select: 'title salary company',
  })
    .populate({
      path: 'employerId',
      select: 'name profilePhoto email companyName',
    })
    .populate({
      path: 'workerId',
      select: 'name profilePhoto email skills',
    })
    .populate({
      path: 'lastMessageId',
      select: 'message attachments createdAt',
    });
});

module.exports = mongoose.model('Conversation', ConversationSchema);
