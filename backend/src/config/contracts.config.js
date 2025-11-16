const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let contractAddresses = null;

function loadContractAddresses() {
    try {
        const contractsPath = '/shared/contracts.json';

        if (fs.existsSync(contractsPath)) {
            const data = fs.readFileSync(contractsPath, 'utf8');
            contractAddresses = JSON.parse(data);

            logger.info('✅ Contract addresses loaded successfully');
            logger.info(`   ElectionManager: ${contractAddresses.ElectionManager}`);
            logger.info(`   VotingSystem: ${contractAddresses.VotingSystem}`);
            logger.info(`   Verifier: ${contractAddresses.Verifier}`);

            return contractAddresses;
        } else {
            logger.warn('⚠️  Contract addresses file not found at /shared/contracts.json');
            logger.warn('   Waiting for contract deployment...');
            return null;
        }
    } catch (error) {
        logger.error('❌ Error loading contract addresses:', error);
        return null;
    }
}

function getContractAddresses() {
    if (!contractAddresses) {
        return loadContractAddresses();
    }
    return contractAddresses;
}

function waitForContracts(timeout = 60000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkContracts = () => {
            const addresses = loadContractAddresses();

            if (addresses) {
                resolve(addresses);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for contract deployment'));
            } else {
                setTimeout(checkContracts, 2000);
            }
        };

        checkContracts();
    });
}

module.exports = {
    loadContractAddresses,
    getContractAddresses,
    waitForContracts
};
