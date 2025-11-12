const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const logger = require('../../utils/logger');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided. Please authenticate.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found. Please login again.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                status: 'error',
                message: 'Account is deactivated. Contact administrator.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token. Please authenticate.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired. Please login again.'
            });
        }

        logger.error('Authentication error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Check if user is voter
const isVoter = (req, res, next) => {
    if (req.user.role !== 'voter' && req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Voter privileges required.'
        });
    }
    next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // If optional auth fails, just continue without user
        next();
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Insufficient permissions.',
            });
        }
        next();
    };
};

module.exports = {
    authenticate,
    isAdmin,
    isVoter,
    optionalAuth,
    authorizeRoles
};
