const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job', // Assuming there's a Job model
        required: true
    },
    jobData: { // Store job details snapshot
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        salary: { type: Number, required: true },
        status: { type: String, default: 'open' }
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['applied', 'reviewed', 'accepted', 'rejected'],
        default: 'applied'
    },
    coverLetter: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
