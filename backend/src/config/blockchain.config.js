const blockchainService = require('../services/blockchain.service');
const zkProofService = require('../services/zkproof.service');
const logger = require('../utils/logger');

async function initializeBlockchain() {
    try {
        logger.info('🔗 Initializing blockchain services...');
        
        // Initialize blockchain service
        await blockchainService.initialize();
        
        // Initialize ZKP service
        await zkProofService.initialize();
        
        logger.info('✅ All blockchain services initialized successfully');
        
        return true;
    } catch (error) {
        logger.error('❌ Blockchain initialization failed:', error);
        logger.warn('⚠️  Server will start but blockchain features may not work');
        return false;
    }
}

module.exports = { initializeBlockchain };
