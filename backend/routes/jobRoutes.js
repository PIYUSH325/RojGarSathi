const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, getJob, getJobCountsByCategory, getJobsByEmployer, updateJobStatus, deleteJob } = require('../controllers/jobController');
const authenticateUser = require('../middleware/auth');

// Public routes for GET
router.route('/').get(getAllJobs);
router.route('/categories/counts').get(getJobCountsByCategory);

// Protected routes for employers
router.route('/employer').get(authenticateUser, getJobsByEmployer);
router.route('/:id').get(getJob);
router.route('/:id/status').put(authenticateUser, updateJobStatus);
router.route('/:id').delete(authenticateUser, deleteJob);

// Protected routes for POST
router.route('/').post(authenticateUser, createJob);

module.exports = router;
