const mongoose = require('mongoose');

const BlockedUserSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocker ID is required'],
      index: true,
    },
    blockedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocked User ID is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'other'],
      default: 'other',
    },
    reasonDetails: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Prevent self-blocking
BlockedUserSchema.pre('save', async function (next) {
  if (this.blockerId.equals(this.blockedId)) {
    throw new Error('You cannot block yourself');
  }
  next();
});

// Unique compound index to prevent duplicate blocks
BlockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

module.exports = mongoose.model('BlockedUser', BlockedUserSchema);
