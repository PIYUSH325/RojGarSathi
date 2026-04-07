const express = require('express');
const router = express.Router();
// const multer = require('multer');
// const path = require('path');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// Configure multer storage for resume uploads
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/resumes/');
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage: storage });

// POST /api/v1/auth/register (Role: worker/employer) with resume upload
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/v1/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
