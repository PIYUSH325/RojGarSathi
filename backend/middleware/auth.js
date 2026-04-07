const jwt = require('jsonwebtoken');
const User = require('../models/User');

const StatusCodes = {
    UNAUTHORIZED: 401,
};

const authenticateUser = async (req, res, next) => {
    // Check header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Support both legacy `userId` and new `id` token fields.
        const userId = payload.id || payload.userId;
        const userName = payload.name || payload.email || null;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid' });
        }
        // Attach the user to the job routes
        req.user = { id: userId, name: userName, role: payload.role };
        next();
    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid' });
    }
};

module.exports = authenticateUser;
