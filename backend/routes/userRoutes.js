const express = require('express');
const router = express.Router();
const { updateProfile, uploadPhoto, uploadResume } = require('../controllers/userController');
const { uploadSingle } = require('../middleware/upload');
const authenticateUser = require('../middleware/auth');

// [PUT] /api/v1/user/profile - Update profile info (protected)
router.put('/profile', authenticateUser, updateProfile);

// [POST] /api/v1/user/upload-photo - Upload profile photo (protected)
router.post('/upload-photo', authenticateUser, uploadSingle('photo'), uploadPhoto);

// [GET] /api/v1/user/profile - Get user profile (protected)
router.get('/profile', authenticateUser, async (req, res) => {
    const user = await require('../models/User').findById(req.user.id).select('-password');
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.status(200).json({ user });
});

// [POST] /api/v1/user/upload-resume - Upload resume (protected)
router.post('/upload-resume', authenticateUser, uploadSingle('resume'), uploadResume);

module.exports = router;
