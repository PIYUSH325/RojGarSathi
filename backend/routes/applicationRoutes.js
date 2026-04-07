const express = require('express');
const router = express.Router();
const { applyJob, getApplications, undoApplication, updateApplicationStatus, getEmployerApplications } = require('../controllers/applicationController');
const authenticateUser = require('../middleware/auth');

// [POST] /api/v1/applications - Apply for job (protected)
router.post('/', authenticateUser, applyJob);

// [GET] /api/v1/applications - Get user's applications (protected)
router.get('/', authenticateUser, getApplications);

// [GET] /api/v1/applications/employer - Get applications for employer's jobs (protected)
router.get('/employer', authenticateUser, getEmployerApplications);

// [PUT] /api/v1/applications/:id/status - Update application status (protected)
router.put('/:id/status', authenticateUser, updateApplicationStatus);

// [DELETE] /api/v1/applications/:id - Undo application (protected)
router.delete('/:id', authenticateUser, undoApplication);

module.exports = router;
