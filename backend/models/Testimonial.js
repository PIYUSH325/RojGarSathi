const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name'],
        trim: true,
        maxlength: 50,
    },
    role: {
        type: String,
        required: [true, 'Please provide role/title'],
        trim: true,
        maxlength: 100,
    },
    rating: {
        type: Number,
        required: [true, 'Please provide rating'],
        min: 1,
        max: 5,
    },
    message: {
        type: String,
        required: [true, 'Please provide testimonial message'],
        trim: true,
        maxlength: 1000,
        minlength: 50,
    },
    date: {
        type: String,
        default: () => new Date().toISOString().slice(0, 10),
    },
    isApproved: {
        type: Boolean,
        default: true, // Auto-approve for now, can be moderated later
    },
    location: {
        type: String,
        default: '',
        trim: true,
    },
    icon: {
        type: String,
        default: 'bi-person-fill',
        enum: ['bi-person-fill', 'bi-hammer', 'bi-house-heart', 'bi-shield-check', 'bi-tools', 'bi-truck', 'bi-gear', 'bi-shop'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
