const web3Provider = require('../blockchain/web3Provider');
const blockchainService = require('../services/blockchain.service');
const zkProofService = require('../services/zkproof.service');
const logger = require('../utils/logger');

async function initializeBlockchain() {
    try {
        logger.info('🔗 Initializing blockchain services...');

        // Step 1: Initialize Web3 connection
        logger.info('📡 Connecting to blockchain network...');
        await web3Provider.initialize();

        // Step 2: Load contract addresses (waits for deployment in Docker)
        logger.info('📋 Loading smart contract addresses...');
        await web3Provider.waitForContracts(60000); // 60 second timeout

        // Step 3: Initialize blockchain service (loads contracts)
        logger.info('📜 Loading contract instances...');
        await blockchainService.initialize();

        // Step 4: Initialize ZKP service
        logger.info('🔐 Initializing zero-knowledge proof service...');
        await zkProofService.initialize();

        logger.info('✅ All blockchain services initialized successfully');
        return true;
    } catch (error) {
        logger.error('❌ Blockchain initialization failed:', error);
        logger.error(error.stack);

        // In production, you might want to exit
        // In development, warn and continue
        if (process.env.NODE_ENV === 'production') {
            throw error;
        } else {
            logger.warn('⚠️  Server will start but blockchain features may not work');
            logger.warn('⚠️  Make sure Ganache is running and contracts are deployed');
            return false;
        }
    }
}

async function getWeb3() {
    if (!web3Provider.isInitialized()) {
        await initializeBlockchain();
    }
    return web3Provider.getWeb3();
}

async function getContractAddress(contractName) {
    if (!web3Provider.isInitialized()) {
        await initializeBlockchain();
    }
    return web3Provider.getContractAddress(contractName);
}

async function getContractAddresses() {
    if (!web3Provider.isInitialized()) {
        await initializeBlockchain();
    }
    return web3Provider.getContractAddresses();
}

module.exports = {
    initializeBlockchain,
    getWeb3,
    getContractAddress,
    getContractAddresses,
    web3Provider
};
