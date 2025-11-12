const logger = require('../../utils/logger');
const { AuditLog } = require('../../models');

const errorHandler = async (err, req, res, next) => {
    // Log error
    logger.error(`Error: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Log to audit if user is authenticated
    if (req.user) {
        try {
            await AuditLog.log({
                action: 'security_event',
                userId: req.user._id,
                description: `Error occurred: ${message}`,
                status: 'failure',
                errorMessage: err.message,
                ipAddress: req.ip,
                metadata: {
                    path: req.originalUrl,
                    method: req.method
                }
            });
        } catch (logError) {
            logger.error('Failed to log error to audit:', logError);
        }
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            status: 'error',
            message: `${field} already exists`
        });
    }

    // Send error response
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err 
        })
    });
};

module.exports = errorHandler;
