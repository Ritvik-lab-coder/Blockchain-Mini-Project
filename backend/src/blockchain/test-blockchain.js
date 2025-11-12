require('dotenv').config();
const { initializeBlockchain } = require('../config/blockchain.config');
const blockchainService = require('../services/blockchain.service');
const logger = require('../utils/logger');

async function testBlockchain() {
    try {
        // Initialize
        await initializeBlockchain();

        // Test commitment calculation
        const voterSecret = '12345';
        const commitment = await blockchainService.calculateCommitment(voterSecret);
        logger.info(`✅ Test commitment: ${commitment}`);

        // Test nullifier calculation
        const nullifier = await blockchainService.calculateNullifier(voterSecret, 0);
        logger.info(`✅ Test nullifier: ${nullifier}`);

        logger.info('✅ All blockchain tests passed!');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testBlockchain();
