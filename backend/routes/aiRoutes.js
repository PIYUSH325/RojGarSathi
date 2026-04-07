const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Public AI chat endpoint used by frontend widget
router.post('/chat', aiController.chat);

module.exports = router;
