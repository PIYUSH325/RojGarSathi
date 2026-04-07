const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Contact = require('../models/Contact');
const Notification = require('../models/Notification');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const fs = require('fs');
const path = require('path');

// [GET] /api/v1/admin/dashboard - Get dashboard statistics
const getDashboardStats = async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });

    // Users by role
    const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Recent activities (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentJobs = await Job.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentApplications = await Application.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Monthly data for charts (last 6 months)
    const monthlyStats = await getMonthlyStats();

    res.status(StatusCodes.OK).json({
        stats: {
            totalUsers,
            totalJobs,
            totalApplications,
            openJobs,
            usersByRole,
            recentActivity: {
                users: recentUsers,
                jobs: recentJobs,
                applications: recentApplications
            },
            monthlyStats
        }
    });
};

// Helper function to get monthly statistics
// Create a new job [POST /api/v1/admin/jobs]
const createJob = async (req, res) => {
    try {
        console.log('Request body:', req.body);  // Debug log
        console.log('Current user:', req.user);  // Debug log

        // Check if user exists and is authenticated
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ msg: 'User not authenticated' });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to create jobs' });
        }

        const { title, description, requirements, category, city, pincode, salary } = req.body;

        // Validate required fields
        if (!title || !description || !requirements || !category || !city || !pincode || !salary) {
            return res.status(400).json({ 
                msg: 'Please provide all required fields: title, description, requirements, category, city, pincode, and salary' 
            });
        }

        // Create the job data object
        const jobData = {
            title: title.trim(),
            description: description.trim(),
            requirements: Array.isArray(requirements) ? requirements.filter(r => r.trim()) : [requirements.trim()],
            category,
            city: city.trim(),
            pincode: pincode.trim(),
            salary: Number(salary),
            status: req.body.status || 'open',
            employer: req.user.userId,
            postedBy: req.user.userId
        };

        console.log('Job data before creation:', jobData);  // Debug log

        // Create the job
        const job = await Job.create(jobData);
        return res.status(201).json({ job });
    } catch (error) {
        console.error('Error creating job:', error);
        return res.status(500).json({ msg: 'Error creating job', error: error.message });
    }
};

const getMonthlyStats = async () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const users = await User.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        const jobs = await Job.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        const applications = await Application.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        months.push({
            month: startOfMonth.toLocaleString('default', { month: 'short', year: 'numeric' }),
            users,
            jobs,
            applications
        });
    }
    return months;
};

// [GET] /api/v1/admin/users - Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, role, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role && role !== 'all') query.role = role;
    if (status === 'verified') query.verified = true;
    if (status === 'unverified') query.verified = false;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.status(StatusCodes.OK).json({
        users,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            hasNext: page * limit < totalUsers,
            hasPrev: page > 1
        }
    });
};

// [PUT] /api/v1/admin/users/:id - Update user details
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, city, pincode, skills, verified } = req.body;

    const user = await User.findByIdAndUpdate(
        id,
        { name, email, role, city, pincode, skills, verified },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
        user,
        msg: 'User updated successfully'
    });
};

// [POST] /api/v1/admin/users - Create new user
const createUser = async (req, res) => {
    const { name, email, password, role, phone, city, pincode, skills } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new BadRequestError('User with this email already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'worker',
        phone,
        city,
        pincode,
        skills: skills || []
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.CREATED).json({
        user: userResponse,
        msg: 'User created successfully'
    });
};

// [PUT] /api/v1/admin/users/:id/block - Block or unblock user
const toggleUserBlock = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Toggle the block status
    user.isBlocked = !user.isBlocked;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.OK).json({
        user: userResponse,
        msg: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
    });
};

// [DELETE] /api/v1/admin/users/:id - Delete user
const deleteUser = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Delete associated files
    if (user.resume) {
        fs.unlink(path.join(__dirname, '..', user.resume), (err) => {
            if (err) console.error('Failed to delete resume:', err);
        });
    }
    if (user.profilePhoto) {
        fs.unlink(path.join(__dirname, '..', user.profilePhoto), (err) => {
            if (err) console.error('Failed to delete profile photo:', err);
        });
    }

    await User.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
        msg: 'User deleted successfully'
    });
};

// [GET] /api/v1/admin/jobs - Get all jobs for management
const getAllJobs = async (req, res) => {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const jobs = await Job.find(query)
        .populate('employer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalJobs = await Job.countDocuments(query);

    res.status(StatusCodes.OK).json({
        jobs,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalJobs / limit),
            totalJobs,
            hasNext: page * limit < totalJobs,
            hasPrev: page > 1
        }
    });
};

// [PUT] /api/v1/admin/jobs/:id - Update job status
const updateJob = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).populate('employer', 'name email');

    if (!job) {
        throw new NotFoundError('Job not found');
    }

    res.status(StatusCodes.OK).json({
        job,
        msg: 'Job updated successfully'
    });
};

// [DELETE] /api/v1/admin/jobs/:id - Delete job
const deleteJob = async (req, res) => {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
        throw new NotFoundError('Job not found');
    }

    await Job.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
        msg: 'Job deleted successfully'
    });
};



// [GET] /api/v1/admin/reports - Generate reports
const getReports = async (req, res) => {
    const { type, startDate, endDate } = req.query;

    let start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();

    let report = {};

    switch (type) {
        case 'users':
            report = await generateUserReport(start, end);
            break;
        case 'jobs':
            report = await generateJobReport(start, end);
            break;
        case 'applications':
            report = await generateApplicationReport(start, end);
            break;
        default:
            report = {
                users: await generateUserReport(start, end),
                jobs: await generateJobReport(start, end),
                applications: await generateApplicationReport(start, end)
            };
    }

    res.status(StatusCodes.OK).json({
        report,
        period: { start, end }
    });
};

// Helper functions for reports
const generateUserReport = async (start, end) => {
    const totalUsers = await User.countDocuments({
        createdAt: { $gte: start, $lte: end }
    });

    const usersByRole = await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    return { totalUsers, usersByRole };
};

const generateJobReport = async (start, end) => {
    const totalJobs = await Job.countDocuments({
        createdAt: { $gte: start, $lte: end }
    });

    const jobsByCategory = await Job.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const jobsByStatus = await Job.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return { totalJobs, jobsByCategory, jobsByStatus };
};

const generateApplicationReport = async (start, end) => {
    const totalApplications = await Application.countDocuments({
        createdAt: { $gte: start, $lte: end }
    });

    const applicationsByStatus = await Application.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return { totalApplications, applicationsByStatus };
};

// [POST] /api/v1/admin/backup - Create database backup
const createBackup = async (req, res) => {
    try {
        // Export data (simplified - in production use mongodump)
        const users = await User.find().select('-password');
        const jobs = await Job.find();
        const applications = await Application.find();
        const contacts = await Contact.find();
        const notifications = await Notification.find();

        const backupData = {
            timestamp: new Date(),
            users,
            jobs,
            applications,
            contacts,
            notifications
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;

        // Stringify so we can send as a downloadable file with proper headers
        const json = JSON.stringify(backupData, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(json));

        // send raw JSON so browser will download the file (Content-Disposition)
        return res.status(StatusCodes.OK).send(json);
    } catch (error) {
        console.error('Backup creation error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: `Failed to create backup: ${error.message}` 
        });
    }
};

// [GET] /api/v1/admin/applications - Get all applications
const getAllApplications = async (req, res) => {
    const applications = await Application.find()
        .populate('user', 'name email role')
        .populate('job', 'title employer status')
        .sort({ appliedDate: -1 });

    res.status(StatusCodes.OK).json({
        applications,
        count: applications.length
    });
};

// [PUT] /api/v1/admin/applications/:id - Update application status or delete
const updateApplication = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (req.body.action === 'delete') {
        await Application.findByIdAndDelete(id);
        res.status(StatusCodes.OK).json({ msg: 'Application deleted' });
    } else {
        const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
        if (!application) {
            throw new NotFoundError('Application not found');
        }
        res.status(StatusCodes.OK).json({ application });
    }
};

// Export all controller functions
module.exports = {
    getDashboardStats,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBlock,
    getAllJobs,
    createJob,
    updateJob,
    deleteJob,
    getReports,
    createBackup
};
