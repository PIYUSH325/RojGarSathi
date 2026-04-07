const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateUser = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateUser);

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
    next();
};

router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/block', adminController.toggleUserBlock);
router.delete('/users/:id', adminController.deleteUser);

// Job Management
router.get('/jobs', adminController.getAllJobs);
router.post('/jobs', adminController.createJob);
router.put('/jobs/:id', adminController.updateJob);
router.delete('/jobs/:id', adminController.deleteJob);

// Reports & Analytics
router.get('/reports', adminController.getReports);

// Database Management
router.post('/backup', adminController.createBackup);

module.exports = router;
