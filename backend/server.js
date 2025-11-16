require('dotenv').config();

const app = require('./src/app');
const connectDatabase = require('./src/database/connection');
const { initializeBlockchain } = require('./src/config/blockchain.config');
const { createDefaultAdmin } = require('./src/utils/seeAdmin');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
    try {
        logger.info('=================================');
        logger.info('🚀 Starting BlockVote Server...');
        logger.info('=================================');

        // Step 1: Connect to MongoDB
        logger.info('📊 Connecting to MongoDB...');
        await connectDatabase();

        // Step 2: Create default admin if doesn't exist
        logger.info('👤 Checking for default admin...');
        await createDefaultAdmin();

        // Step 3: Initialize blockchain services
        logger.info('🔗 Initializing blockchain...');
        await initializeBlockchain();

        // Step 4: Start Express Server
        const server = app.listen(PORT, () => {
            logger.info('=================================');
            logger.info(`✅ Server running successfully!`);
            logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 Port: ${PORT}`);
            logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
            logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
            logger.info('=================================');
        });

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('📴 SIGTERM signal received: closing server gracefully');

            server.close(() => {
                logger.info('✅ HTTP server closed');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('⚠️  Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        logger.error(error.stack);
        process.exit(1);
    }
};

startServer();
