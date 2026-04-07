const Job = require('../models/Job');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const StatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
};

// [POST] /api/v1/jobs
const createJob = async (req, res) => {
    if (!req.user?.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
    }
    // Check if the authenticated user is an employer (Role-based access)
    if (req.user.role !== 'employer') {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Only employers can post jobs.' });
    }

    req.body.employer = req.user.id;
    req.body.postedBy = req.user.id;

    try {
        const job = await Job.create(req.body);

        // Notify all workers about new job posting
        const workers = await User.find({ role: 'worker' });
        const notificationPromises = workers.map(worker =>
            createNotification(
                'job_posted',
                'New Job Posted',
                `A new job "${job.title}" has been posted in ${job.city}. Check it out!`,
                worker._id,
                job._id,
                'Job',
                'low'
            )
        );
        await Promise.all(notificationPromises);

        res.status(StatusCodes.CREATED).json({ job });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

// [GET] /api/v1/jobs (Browse Jobs - O4)
const getAllJobs = async (req, res) => {
    try {
        const { category, city, pincode, status, sort, keyword } = req.query;
        let queryObject = {}; // Start with empty query to show all jobs

        // Apply filters if provided
        if (status) {
            queryObject.status = status;
        } else {
            queryObject.status = 'open'; // Default to open jobs if no status specified
        }

        if (category) {
            queryObject.category = { $regex: category, $options: 'i' };
        }

        if (city) {
            queryObject.city = { $regex: city, $options: 'i' };
        }

        if (pincode) {
            queryObject.pincode = pincode;
        }

        if (keyword) {
            queryObject.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        let result = Job.find(queryObject);

        // Apply sorting
        if (sort) {
            const sortOptions = {
                'newest': '-createdAt',
                'oldest': 'createdAt',
                'salary-high': '-salary',
                'salary-low': 'salary'
            };
            if (sortOptions[sort]) {
                result = result.sort(sortOptions[sort]);
            }
        } else {
            result = result.sort('-createdAt'); // Default sort by newest
        }

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50; // Increased limit to show more jobs
        const skip = (page - 1) * limit;

        result = result.skip(skip).limit(limit);

        const jobs = await result.lean(); // Using lean() for better performance
        const totalJobs = await Job.countDocuments(queryObject);

        res.status(StatusCodes.OK).json({ 
            jobs, 
            count: totalJobs, 
            pages: Math.ceil(totalJobs / limit) 
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Failed to fetch jobs' });
    }
};

// [GET] /api/v1/jobs/:id
const getJob = async (req, res) => {
    const { id: jobId } = req.params;
    const job = await Job.findOne({ _id: jobId });

    if (!job) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: `No job with id :${jobId}` });
    }

    res.status(StatusCodes.OK).json({ job });
};

// [GET] /api/v1/jobs/categories/counts
const getJobCountsByCategory = async (req, res) => {
    try {
        const counts = await Job.aggregate([
            { $match: { status: 'open' } }, // Only count open jobs
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } } // Sort by count descending
        ]);

        res.status(StatusCodes.OK).json({ categories: counts });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

// [GET] /api/v1/jobs/employer (Get jobs posted by the authenticated employer)
const getJobsByEmployer = async (req, res) => {
    if (!req.user?.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
    }
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const employerId = req.user.id;

        let query = { employer: employerId };

        // Apply status filter
        if (status !== 'all') {
            query.status = status;
        }

        // Apply search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalJobs = await Job.countDocuments(query);
        const totalPages = Math.ceil(totalJobs / limit);

        // Add application count to each job
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicationCount = await require('../models/Application').countDocuments({ job: job._id });
            return { ...job, applicationCount };
        }));

        res.status(StatusCodes.OK).json({
            jobs: jobsWithCounts,
            totalPages,
            currentPage: parseInt(page),
            totalJobs
        });
    } catch (error) {
        console.error('Error fetching employer jobs:', error);
        res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Failed to fetch jobs' });
    }
};

// [PUT] /api/v1/jobs/:id/status (Update job status)
const updateJobStatus = async (req, res) => {
    const { id: jobId } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'closed', 'reviewing'].includes(status)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid status' });
    }

    try {
    const job = await Job.findOneAndUpdate(
            { _id: jobId, employer: req.user.id },
            { status },
            { new: true, runValidators: true }
        );

        if (!job) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Job not found or unauthorized' });
        }

        res.status(StatusCodes.OK).json({ job });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

// [DELETE] /api/v1/jobs/:id (Delete job)
const deleteJob = async (req, res) => {
    if (!req.user?.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
    }
    const { id: jobId } = req.params;

    try {
        const job = await Job.findOneAndDelete({ _id: jobId, employer: req.user.id });

        if (!job) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Job not found or unauthorized' });
        }

        res.status(StatusCodes.OK).json({ msg: 'Job deleted successfully' });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

module.exports = {
    createJob,
    getAllJobs,
    getJob,
    getJobCountsByCategory,
    getJobsByEmployer,
    updateJobStatus,
    deleteJob,
};
