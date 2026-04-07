require('dotenv').config();
const connectDB = require('./config/db');
const Application = require('./models/Application');
const Job = require('./models/Job');
const User = require('./models/User');

const createSampleApplication = async () => {
    try {
        await connectDB();

        // Find sample employer and worker
        const employer = await User.findOne({ email: 'employer@example.com' });
        const worker = await User.findOne({ email: 'worker@example.com' });

        if (!employer || !worker) {
            console.log('Employer or worker not found');
            process.exit(1);
        }

        // Find a job posted by the employer
        const job = await Job.findOne({ employer: employer._id });

        if (!job) {
            console.log('No job found for employer');
            process.exit(1);
        }

        // Check if application already exists
        const existingApplication = await Application.findOne({
            user: worker._id,
            job: job._id
        });

        if (existingApplication) {
            console.log('Application already exists');
            process.exit(0);
        }

        // Create application
        const application = await Application.create({
            user: worker._id,
            job: job._id,
            jobData: {
                title: job.title,
                description: job.description,
                category: job.category,
                city: job.city,
                pincode: job.pincode,
                salary: job.salary,
                status: job.status
            },
            coverLetter: 'I am very interested in this position and believe my skills would be a great fit.'
        });

        console.log('Sample application created successfully:', application);
        process.exit(0);
    } catch (error) {
        console.error('Error creating sample application:', error);
        process.exit(1);
    }
};

createSampleApplication();
