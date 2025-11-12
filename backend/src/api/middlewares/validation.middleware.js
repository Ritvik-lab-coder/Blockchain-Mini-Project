const Joi = require('joi');
const logger = require('../../utils/logger');

// Generic validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn('Validation error:', errors);

            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors
            });
        }

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};

// Validation schemas
const schemas = {
    // User registration
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        role: Joi.string().valid('voter', 'observer').default('voter')
    }),

    // User login
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Voter registration
    voterRegistration: Joi.object({
        verificationDocuments: Joi.object({
            idProof: Joi.string(),
            addressProof: Joi.string()
        }).optional()
    }),

    // Election creation
    createElection: Joi.object({
        title: Joi.string().min(3).max(200).required(),
        description: Joi.string().min(10).max(1000).required(),
        electionType: Joi.string().valid('general', 'local', 'organizational', 'poll').default('general'),
        candidates: Joi.array().items(
            Joi.object({
                name: Joi.string().min(2).max(100).required(),
                description: Joi.string().max(500).optional(),
                party: Joi.string().max(100).optional(),
                imageUrl: Joi.string().uri().optional()
            })
        ).min(1).required(),
        startTime: Joi.date().iso().greater('now').required(),
        endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
        metadata: Joi.object({
            visibility: Joi.string().valid('public', 'private', 'restricted').default('public'),
            requiresVerification: Joi.boolean().default(true),
            allowMultipleVotes: Joi.boolean().default(false)
        }).optional()
    }),

    // Cast vote
    castVote: Joi.object({
        electionId: Joi.string().required(),
        candidateId: Joi.number().integer().min(0).required()
    }),

    // Update election state
    updateElectionState: Joi.object({
        state: Joi.string().valid('registration', 'voting', 'ended').required()
    }),

    // Approve/reject voter
    voterDecision: Joi.object({
        status: Joi.string().valid('approved', 'rejected').required(),
        reason: Joi.string().when('status', {
            is: 'rejected',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    })
};

module.exports = {
    validate,
    schemas
};
