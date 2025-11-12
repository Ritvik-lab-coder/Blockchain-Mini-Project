require('dotenv').config();
const app = require('./src/app');
const connectDatabase = require('./src/database/connection');
const { initializeBlockchain } = require('./src/config/blockchain.config');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize blockchain services
        await initializeBlockchain();

        // Start Express Server
        const server = app.listen(PORT, () => {
            logger.info('=================================');
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
            logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
            logger.info('=================================');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                logger.info('HTTP server closed');
            });
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
