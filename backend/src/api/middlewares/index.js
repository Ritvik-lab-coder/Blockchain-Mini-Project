const { authenticate, isAdmin, isVoter, optionalAuth } = require('./auth.middleware');
const { validate, schemas } = require('./validation.middleware');
const { apiLimiter, authLimiter, votingLimiter, zkpLimiter } = require('./rateLimiter.middleware');
const { requestLogger, errorLogger } = require('./logger.middleware');
const errorHandler = require('./errorHandler.middleware');
const { corsMiddleware, handleCorsError } = require('./cors.middleware');
const asyncHandler = require('./asyncHandler.middleware');

module.exports = {
    // Auth
    authenticate,
    isAdmin,
    isVoter,
    optionalAuth,
    
    // Validation
    validate,
    schemas,
    
    // Rate limiting
    apiLimiter,
    authLimiter,
    votingLimiter,
    zkpLimiter,
    
    // Logging
    requestLogger,
    errorLogger,
    
    // Error handling
    errorHandler,
    
    // CORS
    corsMiddleware,
    handleCorsError,
    
    // Utils
    asyncHandler
};
