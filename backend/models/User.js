const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name'],
        trim: true,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide a valid email'],
        // unique: true, // We will use a compound index instead
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 6,
        select: false, // Prevents password from being returned in queries by default
    },
    role: {
        type: String,
        enum: ['worker', 'employer', 'admin'], // Role-based access (O1)
        default: 'worker',
    },
    // Worker/Employer Specific Fields (O2, O3)
    city: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    // Worker Specific (O2)
    skills: { type: [String], default: [] },
        salaryRange: { type: String, trim: true, default: '' },
        experience: {
            type: [{ company: { type: String, trim: true, default: '' }, role: { type: String, trim: true, default: '' } }],
            default: []
        },
    availability: { type: Boolean, default: true },
    verified: { type: Boolean, default: false }, // Trust & Safety (O6)
    documents: { type: [{ type: String, url: String }], default: [] }, // Document URLs
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    resume: { type: String, default: '' }, // Added resume field for worker's resume URL or path
    profilePhoto: { type: String, default: '' }, // Added profile photo URL or path
    
    // Enhanced Worker Specific Fields
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    experienceYears: { type: Number, min: 0, default: 0 },
    education: { type: [{ level: String, field: String, institution: String, year: Number }], default: [] },
    hourlyRate: { type: Number, min: 0, default: 0 },
    portfolioLinks: { type: [String], default: [] },
    preferredJobTypes: { type: [String], default: [] },
    availabilitySchedule: {
      type: Map,
      of: String,
      default: {}
    },
    // Employer Specific Fields
    companyName: { type: String, trim: true, default: '' },
    companyDescription: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    notifications: {
        newApplications: { type: Boolean, default: true },
        applicationUpdates: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: false },
    },
    resetPasswordToken: {
        type: String,
        default: null,
        select: false,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
        select: false,
    },
}, { timestamps: true });

// Create a compound index to ensure the combination of email and role is unique
UserSchema.index({ email: 1, role: 1 }, { unique: true });

// --- Mongoose Middleware ---

// Pre-save middleware to hash password before saving to DB
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- Instance Methods ---

// Method to generate JWT
UserSchema.methods.createJWT = function () {
    return jwt.sign(
        { id: this._id, email: this.email, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_LIFETIME }
    );
};

// Method to compare candidate password with hashed password in DB
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

module.exports = mongoose.model('User', UserSchema);