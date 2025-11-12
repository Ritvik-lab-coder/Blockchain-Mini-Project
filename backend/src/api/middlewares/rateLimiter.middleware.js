const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later.'
        });
    }
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many login attempts, please try again in 15 minutes.'
        });
    }
});

// Voting rate limiter
const votingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 votes per minute (generous for testing)
    message: {
        status: 'error',
        message: 'Too many voting attempts, please slow down.'
    },
    handler: (req, res) => {
        logger.warn(`Voting rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Please wait before submitting another vote.'
        });
    }
});

// ZKP generation limiter (computationally expensive)
const zkpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 proof generations per minute
    message: {
        status: 'error',
        message: 'Too many proof generation requests.'
    },
    handler: (req, res) => {
        logger.warn(`ZKP rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many proof generation requests, please wait.'
        });
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    votingLimiter,
    zkpLimiter
};
