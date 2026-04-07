const express = require('express');
const chatController = require('../controllers/chatController');
const authenticateUser = require('../middleware/auth');
const { uploadChatMedia } = require('../middleware/chatUpload');

const router = express.Router();

// Required endpoint for media upload API.
router.post('/upload', authenticateUser, uploadChatMedia.single('file'), chatController.uploadMessageMedia);

module.exports = router;
