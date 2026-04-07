const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// [GET] /api/v1/analytics/employer - Get analytics for employer
const getEmployerAnalytics = async (req, res) => {
    if (!req.user?.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Authentication required' });
    }
    try {
        const employerId = req.user.id;

        // Get all jobs posted by this employer
        const jobs = await Job.find({ employer: employerId });
        const jobIds = jobs.map(job => job._id);

        // Calculate basic stats
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(job => job.status === 'open').length;

        // Get applications for employer's jobs
        const applications = await Application.find({ job: { $in: jobIds } });
        const totalApplications = applications.length;

        // Calculate new applications (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newApplications = applications.filter(app =>
            new Date(app.appliedDate) >= thirtyDaysAgo
        ).length;

        // Calculate jobs posted this month
        const thisMonth = new Date();
        thisMonth.setDate(1); // First day of current month
        const jobsThisMonth = jobs.filter(job =>
            new Date(job.createdAt) >= thisMonth
        ).length;

        // Calculate applications this month
        const applicationsThisMonth = applications.filter(app =>
            new Date(app.appliedDate) >= thisMonth
        ).length;

        // Calculate accepted applications
        const acceptedApplications = applications.filter(app =>
            app.status === 'accepted'
        ).length;

        // Calculate response rate (applications that have been reviewed/accepted/rejected)
        const respondedApplications = applications.filter(app =>
            ['reviewed', 'accepted', 'rejected'].includes(app.status)
        ).length;
        const responseRate = totalApplications > 0 ?
            Math.round((respondedApplications / totalApplications) * 100) : 0;

        const analytics = {
            totalJobs,
            activeJobs,
            totalApplications,
            newApplications,
            jobsThisMonth,
            applicationsThisMonth,
            acceptedApplications,
            responseRate
        };

        res.status(200).json({
            analytics,
            msg: 'Analytics retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching employer analytics:', error);
        res.status(500).json({ msg: 'Failed to fetch analytics' });
    }
};

module.exports = {
    getEmployerAnalytics
};
