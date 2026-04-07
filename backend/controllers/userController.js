const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { UnauthenticatedError, BadRequestError } = require('../errors');
const path = require('path');
const fs = require('fs');

const { validateWorkerProfile } = require('../validators/profileValidator');

// [PUT] /api/v1/user/profile - Update user profile information
const updateProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        throw new UnauthenticatedError('User not found');
    }

    let updateData = {};

    // Parse skills if string
    let bodyData = { ...req.body };
    if (typeof bodyData.skills === 'string') {
        bodyData.skills = bodyData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof bodyData.education === 'string') {
        try {
            bodyData.education = JSON.parse(bodyData.education);
        } catch {
            bodyData.education = [];
        }
    }

    if (user.role === 'worker') {
        updateData = {
            city: bodyData.city || '',
            pincode: bodyData.pincode || '',
            salaryRange: bodyData.salaryRange || '',
            skills: bodyData.skills || [],
            experience: bodyData.experience || [],
            bio: bodyData.bio || '',
            experienceYears: Number(bodyData.experienceYears) || 0,
            education: bodyData.education || [],
            hourlyRate: Number(bodyData.hourlyRate) || 0,
            portfolioLinks: bodyData.portfolioLinks || [],
            preferredJobTypes: bodyData.preferredJobTypes || [],
            availabilitySchedule: bodyData.availabilitySchedule || {}
        };
        // Optional validation
        const { error } = validateWorkerProfile(bodyData);
        if (error && !error.details.some(d => d.message.includes('is required'))) {
            console.log('Validation warning (non-required):', error.details);
        }
    } else if (user.role === 'employer') {
        updateData = {
            companyName: bodyData.companyName || '',
            companyDescription: bodyData.companyDescription || '',
            contactEmail: bodyData.contactEmail || '',
            contactPhone: bodyData.contactPhone || '',
            website: bodyData.website || '',
            address: bodyData.address || '',
            notifications: bodyData.notifications || user.notifications
        };
    } else {
        throw new BadRequestError('Invalid user role');
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: req.user.id },
        updateData,
        { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        throw new UnauthenticatedError('User not found');
    }

    res.status(StatusCodes.OK).json({
        user: {
            ...updatedUser.toObject(),
            id: updatedUser._id
        },
        msg: 'Profile updated successfully'
    });
};

// [POST] /api/v1/user/upload-photo - Upload profile photo
const uploadPhoto = async (req, res) => {
    if (!req.file) {
        throw new BadRequestError('No photo file uploaded');
    }

    // Save relative path instead of absolute path
    const photoPath = req.file.path.replace(/\\/g, '/').replace(/^uploads\//, ''); // Remove 'uploads/' prefix to make it relative

    const user = await User.findOneAndUpdate(
        { _id: req.user.id },
        { profilePhoto: photoPath },
        { new: true }
    ).select('-password');

    if (!user) {
        // Delete uploaded file if user not found
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete orphan photo:', err);
        });
        throw new UnauthenticatedError('User not found');
    }

    res.status(StatusCodes.OK).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePhoto: user.profilePhoto
        },
        msg: 'Profile photo uploaded successfully'
    });
};

// [POST] /api/v1/user/upload-resume - Upload resume
const uploadResume = async (req, res) => {
    if (!req.file) {
        throw new BadRequestError('No resume file uploaded');
    }

    // Save relative path instead of absolute path
    const resumePath = req.file.path.replace(/\\/g, '/').replace(/^uploads\//, ''); // Remove 'uploads/' prefix to make it relative

    const user = await User.findOneAndUpdate(
        { _id: req.user.id },
        { resume: resumePath },
        { new: true }
    ).select('-password');

    if (!user) {
        // Delete uploaded file if user not found
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete orphan resume:', err);
        });
        throw new UnauthenticatedError('User not found');
    }

    res.status(StatusCodes.OK).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            resume: user.resume
        },
        msg: 'Resume uploaded successfully'
    });
};

module.exports = {
    updateProfile,
    uploadPhoto,
    uploadResume
};
