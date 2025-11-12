const logger = require('../../utils/logger');

// Request logger middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info(`→ ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id
    });

    // Override res.json to log response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
        const duration = Date.now() - startTime;
        
        logger.info(`← ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });

        return originalJson(data);
    };

    next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
    logger.error(`Error in ${req.method} ${req.originalUrl}:`, {
        error: err.message,
        stack: err.stack,
        userId: req.user?.id,
        ip: req.ip
    });

    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
};
