const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');
const { UnauthenticatedError, BadRequestError, NotFoundError } = require('../errors');

// [POST] /api/v1/applications - Apply for a job
const applyJob = async (req, res) => {
    const { jobId, coverLetter = '' } = req.body;

    if (!jobId) {
        throw new BadRequestError('Job ID is required');
    }

    // Find the job to get details and check if open
    const job = await Job.findById(jobId);
    if (!job) {
        throw new BadRequestError('Job not found');
    }
    if (job.status !== 'open') {
        throw new BadRequestError('This job is no longer accepting applications');
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
        user: req.user.id,
        job: jobId
    });

    if (existingApplication) {
        throw new BadRequestError('You have already applied for this job');
    }

    // Create application with job data snapshot
    const application = await Application.create({
        user: req.user.id,
        job: jobId,
        jobData: {
            title: job.title,
            description: job.description,
            category: job.category,
            city: job.city,
            pincode: job.pincode,
            salary: job.salary,
            status: job.status
        },
        coverLetter
    });

    // Populate for response
    await application.populate('user', 'name email');
    await application.populate('job', 'title employer');

    res.status(StatusCodes.CREATED).json({
        application,
        msg: 'Application submitted successfully'
    });
};

// [GET] /api/v1/applications - Get user's applications
const getApplications = async (req, res) => {
    const applications = await Application.find({ user: req.user.id })
        .sort({ appliedDate: -1 });

    res.status(StatusCodes.OK).json({
        applications,
        count: applications.length
    });
};

// [DELETE] /api/v1/applications/:id - Undo application (first implementation)
const undoApplicationFirst = async (req, res) => {
    const { id } = req.params;

        const application = await Application.findOneAndDelete({
            _id: id,
            user: req.user.id
        });

    if (!application) {
        throw new NotFoundError('Application not found');
    }

    res.status(StatusCodes.OK).json({
        msg: 'Application withdrawn successfully'
    });
};

// [PUT] /api/v1/applications/:id/status - Update application status (for employers)
const updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['applied', 'reviewed', 'accepted', 'rejected'].includes(status)) {
        throw new BadRequestError('Invalid status');
    }

    const application = await Application.findById(id).populate('user', 'name email');
    if (!application) {
        throw new NotFoundError('Application not found');
    }

    // Check if the user is the employer of the job
    const job = await Job.findById(application.job);
    if (!job || job.employer.toString() !== req.user.id) {
        throw new UnauthenticatedError('Not authorized to update this application');
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // Create notification for the applicant if status changed
    if (oldStatus !== status) {
        let title, message;
        if (status === 'accepted') {
            title = 'Application Accepted';
            message = `Congratulations! Your application for "${job.title}" has been accepted.`;
        } else if (status === 'rejected') {
            title = 'Application Update';
            message = `Your application for "${job.title}" has been reviewed.`;
        } else if (status === 'reviewed') {
            title = 'Application Reviewed';
            message = `Your application for "${job.title}" is under review.`;
        }

        if (title && message) {
            await createNotification('application_status_update', title, message, application.user._id, application._id, 'Application', 'medium');
        }
    }

    res.status(StatusCodes.OK).json({
        application,
        msg: 'Application status updated successfully'
    });
};

// [DELETE] /api/v1/applications/:id - Undo application
const undoApplication = async (req, res) => {
    try {
        const { id: applicationId } = req.params;

        if (!applicationId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Application ID is required' });
        }

        // Find the application and populate job details
        const application = await Application.findById(applicationId).populate('job');
        
        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Application not found' });
        }

        // Check if the user is the owner of the application
        if (application.user.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Not authorized to withdraw this application' });
        }

        // Only allow withdrawal if the application is still applied (not reviewed/accepted/rejected)
        if (application.status !== 'applied') {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Cannot withdraw application - already processed' });
        }

        // Delete the application
        const deletedApplication = await Application.findByIdAndDelete(applicationId);
        
        if (!deletedApplication) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Failed to withdraw application' });
        }

        // Notify employer about withdrawal if job still exists
        if (application.job) {
            try {
                await createNotification(
                    'application_withdrawn',
                    'Application Withdrawn',
                    `An application for "${application.job.title}" has been withdrawn.`,
                    application.job.employer,
                    application.job._id,
                    'Job',
                    'low'
                );
            } catch (notifyError) {
                console.error('Error sending withdrawal notification:', notifyError);
                // Continue since notification is not critical
            }
        }

        res.status(StatusCodes.OK).json({ 
            success: true,
            msg: 'Application withdrawn successfully' 
        });
    } catch (error) {
        console.error('Error withdrawing application:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: 'Failed to withdraw application. Please try again.' 
        });
    }
};

// [GET] /api/v1/applications/employer - Get applications for employer's jobs
const getEmployerApplications = async (req, res) => {
    try {
const employerId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find all jobs posted by this employer
        const Job = require('../models/Job');
        const jobs = await Job.find({ employer: employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        if (jobIds.length === 0) {
            return res.status(200).json({
                applications: [],
                count: 0,
                totalPages: 0,
                currentPage: page
            });
        }

        // Get total count for pagination
        const totalCount = await Application.countDocuments({ job: { $in: jobIds } });

        // Find applications for these jobs with pagination
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate('user', 'name email city pincode skills resume profilePhoto contactEmail contactPhone')
            .populate('job', 'title category city pincode salary')
            .sort({ appliedDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            applications,
            count: totalCount,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching employer applications:', error);
        res.status(500).json({ msg: 'Failed to fetch applications' });
    }
};

module.exports = {
    applyJob,
    getApplications,
    undoApplication,
    updateApplicationStatus,
    getEmployerApplications
};
