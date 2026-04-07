const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Optional authentication middleware
 * Authenticates the user if a token is provided, but allows the request to proceed without authentication
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Support both legacy `userId` and new `id` token fields.
        const userId = payload.id || payload.userId;
        const userName = payload.name || payload.email || null;
        req.user = { id: userId, name: userName, role: payload.role };
        // If verification succeeded but no id present, treat as unauthenticated
        if (!userId) req.user = null;
    } catch (error) {
        // If token is invalid, continue without authentication
        req.user = null;
    }
    
    next();
};

module.exports = optionalAuth;
