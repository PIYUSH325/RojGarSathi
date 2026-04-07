const Testimonial = require('../models/Testimonial');

const StatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
};

// [POST] /api/v1/testimonials
const createTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.create(req.body);
        res.status(StatusCodes.CREATED).json({
            testimonial,
            msg: 'Testimonial submitted successfully'
        });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

// [GET] /api/v1/testimonials
const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isApproved: true })
            .sort({ createdAt: -1 }); // Most recent first

        res.status(StatusCodes.OK).json({
            testimonials,
            count: testimonials.length
        });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

// [GET] /api/v1/testimonials/:id
const getTestimonial = async (req, res) => {
    const { id: testimonialId } = req.params;
    try {
        const testimonial = await Testimonial.findOne({
            _id: testimonialId,
            isApproved: true
        });

        if (!testimonial) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: `No testimonial with id :${testimonialId}`
            });
        }

        res.status(StatusCodes.OK).json({ testimonial });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

module.exports = {
    createTestimonial,
    getAllTestimonials,
    getTestimonial,
};
