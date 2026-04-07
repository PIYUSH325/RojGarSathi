const express = require('express');
const router = express.Router();
const { getEmployerAnalytics } = require('../controllers/analyticsController');
const authenticateUser = require('../middleware/auth');

// [GET] /api/v1/analytics/employer - Get analytics for employer (protected)
router.get('/employer', authenticateUser, getEmployerAnalytics);

module.exports = router;
