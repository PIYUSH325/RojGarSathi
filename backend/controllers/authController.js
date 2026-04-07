const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// [POST] /api/v1/auth/register
const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    // let resumePath = '';

    if (!name || !email || !password || !role) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide name, email, password, and role' });
    }

    // If role is worker and resume file is uploaded, get the file path
    // if (role === 'worker' && req.file) {
    //     resumePath = req.file.path; // relative path to uploaded resume file
    // }

    // Check if user with the same email and role already exists
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
        // Delete uploaded resume file if user exists to avoid orphan files
        // if (resumePath) {
        //     fs.unlink(resumePath, (err) => {
        //         if (err) console.error('Failed to delete orphan resume file:', err);
        //     });
        // }
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: `An account with this email already exists for the '${role}' role.` });
    }

    const userData = { name, email, password, role };
    // if (resumePath) {
    //     userData.resume = resumePath;
    // }

    const user = await User.create(userData);
    const token = user.createJWT();

    // Send back necessary user info and token
    res.status(StatusCodes.CREATED).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePhoto: user.profilePhoto,
            resume: user.resume,
            city: user.city || '',
            pincode: user.pincode || '',
            skills: user.skills || [],
            salaryRange: user.salaryRange || '',
            experience: user.experience || [],
            companyName: user.companyName || '',
            companyDescription: user.companyDescription || '',
            contactEmail: user.contactEmail || '',
            contactPhone: user.contactPhone || '',
            website: user.website || '',
            address: user.address || '',
            notifications: user.notifications || {
                newApplications: true,
                applicationUpdates: true,
                weeklyReports: false,
            },
        },
        token,
    });
};

// [POST] /api/v1/auth/login
const login = async (req, res) => {
    const { email, password, role } = req.body; // Added role

    if (!email || !password || !role) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide email, password, and role' });
    }

    // Log the incoming login attempt (without logging the password)
    console.log(`Login attempt: email=${email}, role=${role}`);

    // 1. Find user by email AND role, select password explicitly
    const user = await User.findOne({ email, role }).select('+password');
    if (!user) {
        // If no user with that email+role, check if user exists with that email under another role
        const userByEmail = await User.findOne({ email }).select('+password');
        if (userByEmail) {
            console.warn(`Login failed - role mismatch for email=${email}. Stored role=${userByEmail.role}, attempted role=${role}`);
            // In production we avoid revealing account existence/role. Only give a helpful hint in development.
            if (process.env.NODE_ENV !== 'production') {
                return res.status(StatusCodes.UNAUTHORIZED).json({ msg: `Account exists with role '${userByEmail.role}'. Please select that role to login.` });
            } else {
                return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
            }
        }
        console.warn(`Login failed - user not found for email=${email} role=${role}`);
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    // 2. Compare password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        console.warn(`Login failed - wrong password for userId=${user._id} email=${email}`);
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    // 3. Create and return JWT
    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePhoto: user.profilePhoto,
            resume: user.resume,
            city: user.city || '',
            pincode: user.pincode || '',
            skills: user.skills || [],
            salaryRange: user.salaryRange || '',
            experience: user.experience || [],
            companyName: user.companyName || '',
            companyDescription: user.companyDescription || '',
            contactEmail: user.contactEmail || '',
            contactPhone: user.contactPhone || '',
            website: user.website || '',
            address: user.address || '',
            notifications: user.notifications || {
                newApplications: true,
                applicationUpdates: true,
                weeklyReports: false,
            },
        },
        token,
    });
};

// [POST] /api/v1/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email is required' });
    }

    // Do not reveal whether the email exists
    const genericMessage = {
        msg: 'If an account exists for this email, a reset link has been sent.'
    };

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordToken +resetPasswordExpires');

        if (!user) {
            return res.status(StatusCodes.OK).json(genericMessage);
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        // Prefer the calling frontend origin (e.g., :3000 or :3001), then env fallback.
        const requestOrigin = req.get('origin');
        const trustedOrigin = requestOrigin && /^https?:\/\//i.test(requestOrigin)
            ? requestOrigin
            : null;
        const frontendBase = (trustedOrigin || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
        const resetUrl = `${frontendBase}/reset-password/${rawToken}`;

        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
            <h2 style="margin-bottom:12px;">Reset your RojgarSathi password</h2>
            <p>You requested a password reset. Click the button below to continue.</p>
            <p style="margin:24px 0;">
              <a href="${resetUrl}" style="background:#0d6efd;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'RojgarSathi Password Reset',
                html,
            });
        } catch (mailError) {
            // Roll back token if email delivery fails so stale links are not stored.
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save({ validateBeforeSave: false });
            throw mailError;
        }

        return res.status(StatusCodes.OK).json(genericMessage);
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(StatusCodes.OK).json(genericMessage);
    }
};

// [POST] /api/v1/auth/reset-password/:token
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Reset token is required' });
    }

    if (!password || password.length < 6) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(StatusCodes.OK).json({ msg: 'Password reset successful. Please login with your new password.' });
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
};