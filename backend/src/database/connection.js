const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDatabase = async () => {
    try {
        // Remove deprecated options - they're no longer needed in Mongoose 6+
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI, options);

        logger.info('✅ MongoDB connected successfully');
        logger.info(`📍 Database: ${mongoose.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️  MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('🛑 MongoDB connection closed due to app termination');
            process.exit(0);
        });

    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDatabase;
