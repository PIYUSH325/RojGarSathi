const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide job title'],
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: [true, 'Please provide job description'],
        trim: true,
        maxlength: 1000,
    },
    category: {
        type: String,
        required: [true, 'Please provide job category'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'Please provide city'],
        trim: true,
    },
    pincode: {
        type: String,
        required: [true, 'Please provide pincode'],
        trim: true,
    },
    salary: {
        type: Number,
        min: 0,
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'reviewing'],
        default: 'open',
    },
    requirements: [{
        type: String,
        trim: true,
    }],
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Employer is required'],
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Posted by is required'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Job', JobSchema);
