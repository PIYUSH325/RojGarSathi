const Joi = require('joi');

const workerProfileSchema = Joi.object({
  city: Joi.string().allow('').allow(null).trim().max(100).optional(),
  pincode: Joi.string().allow('').allow(null).pattern(/^[1-9][0-9]{5}$/).optional(),
  salaryRange: Joi.string().allow('').allow(null).valid('', 'upto20k', '20k-40k', '40k-60k', '60k-80k', 'above80k').optional(),
  skills: Joi.array().allow(null).items(Joi.string().trim().max(50)).optional(),
  experience: Joi.array().allow(null).items(Joi.object({
    company: Joi.string().allow('').allow(null),
    role: Joi.string().allow('').allow(null)
  })).optional(),
  bio: Joi.string().trim().max(500),
  experienceYears: Joi.number().min(0).max(50),
  education: Joi.array().items(
    Joi.object({
      level: Joi.string().trim().max(50),
      field: Joi.string().trim().max(100),
      institution: Joi.string().trim().max(200),
      year: Joi.number().min(1900).max(2030)
    })
  ),
  hourlyRate: Joi.number().min(0).max(10000),
  portfolioLinks: Joi.array().items(Joi.string().uri().max(500)),
  preferredJobTypes: Joi.array().items(Joi.string().trim().max(50)),
  availabilitySchedule: Joi.object().pattern(Joi.string(), Joi.string())
});

const employerProfileSchema = Joi.object({
  companyName: Joi.string().allow('').trim().max(100).optional(),
  companyDescription: Joi.string().allow('').trim().max(1000).optional(),
  contactEmail: Joi.string().allow('').email().optional(),
  contactPhone: Joi.string().pattern(/^[6-9][0-9]{9}$/),
  website: Joi.string().uri(),
  address: Joi.string().trim().max(500),
  notifications: Joi.object({
    newApplications: Joi.boolean(),
    applicationUpdates: Joi.boolean(),
    weeklyReports: Joi.boolean()
  })
});

const validateWorkerProfile = (data) => workerProfileSchema.validate(data);
const validateEmployerProfile = (data) => employerProfileSchema.validate(data);

module.exports = {
  validateWorkerProfile,
  validateEmployerProfile
};

