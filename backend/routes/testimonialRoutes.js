const express = require('express');
const router = express.Router();
const { createTestimonial, getAllTestimonials, getTestimonial } = require('../controllers/testimonialController');

// Public routes
router.route('/').get(getAllTestimonials);
router.route('/:id').get(getTestimonial);

// POST route for creating testimonials (public - no auth required)
router.route('/').post(createTestimonial);

module.exports = router;
