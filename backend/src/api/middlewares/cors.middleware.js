const cors = require('cors');

// Custom CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173'
        ];

        // Allow requests with no origin (mobile apps, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

// CORS error handler
const handleCorsError = (err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        res.status(403).json({
            status: 'error',
            message: 'CORS policy: Access denied'
        });
    } else {
        next(err);
    }
};

module.exports = {
    corsMiddleware,
    handleCorsError
};
