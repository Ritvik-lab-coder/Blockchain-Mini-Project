const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class Web3Provider {
    constructor() {
        this.web3 = null;
        this.connected = false;
        this.contractAddresses = null;
    }

    // Initialize Web3 connection
    async initialize() {
        try {
            // Use BLOCKCHAIN_NETWORK from env (docker: http://ganache:8545)
            const ganacheUrl = process.env.BLOCKCHAIN_NETWORK || process.env.GANACHE_URL || 'http://localhost:8545';

            // Web3 v4.x syntax - direct URL initialization
            this.web3 = new Web3(ganacheUrl);

            // Test connection
            const networkId = await this.web3.eth.net.getId();
            const accounts = await this.web3.eth.getAccounts();

            this.connected = true;

            logger.info('✅ Web3 connected to Ganache');
            logger.info(`📍 Network ID: ${networkId}`);
            logger.info(`👥 Available accounts: ${accounts.length}`);

            return this.web3;
        } catch (error) {
            logger.error('❌ Web3 connection failed:', error);
            this.connected = false;
            throw error;
        }
    }

    // Load contract addresses from shared volume
    loadContractAddresses() {
        try {
            // In Docker, contracts are at /shared/contracts.json (from deployer)
            // In local dev, they might be in build/contracts
            const dockerPath = '/shared/contracts.json';
            const localPath = path.join(__dirname, '../../build/contracts.json');

            let contractsPath = fs.existsSync(dockerPath) ? dockerPath : localPath;

            if (fs.existsSync(contractsPath)) {
                const data = fs.readFileSync(contractsPath, 'utf8');
                this.contractAddresses = JSON.parse(data);

                logger.info('✅ Contract addresses loaded successfully');
                logger.info(`   From: ${contractsPath}`);  // Show which path was used
                logger.info(`   ElectionManager: ${this.contractAddresses.ElectionManager}`);
                logger.info(`   VotingSystem: ${this.contractAddresses.VotingSystem}`);
                logger.info(`   Verifier: ${this.contractAddresses.Verifier}`);

                return this.contractAddresses;
            } else {
                logger.warn('⚠️  Contract addresses file not found');
                logger.warn(`   Tried Docker path: ${dockerPath}`);
                logger.warn(`   Tried Local path: ${localPath}`);
                return null;
            }
        } catch (error) {
            logger.error('❌ Error loading contract addresses:', error);
            return null;
        }
    }


    // Wait for contracts to be deployed (for Docker startup)
    async waitForContracts(timeout = 60000, interval = 2000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            logger.info('⏳ Waiting for contract deployment...');

            const checkContracts = () => {
                const addresses = this.loadContractAddresses();

                if (addresses && addresses.ElectionManager && addresses.VotingSystem && addresses.Verifier) {
                    logger.info('✅ Contracts found and loaded');
                    resolve(addresses);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for contract deployment'));
                } else {
                    logger.info('   Still waiting for contracts...');
                    setTimeout(checkContracts, interval);
                }
            };

            checkContracts();
        });
    }

    // Get contract addresses
    getContractAddresses() {
        if (!this.contractAddresses) {
            this.contractAddresses = this.loadContractAddresses();
        }
        return this.contractAddresses;
    }

    // Get specific contract address
    getContractAddress(contractName) {
        const addresses = this.getContractAddresses();
        if (!addresses) {
            throw new Error('Contract addresses not loaded');
        }
        return addresses[contractName];
    }

    // Get Web3 instance
    getWeb3() {
        if (!this.connected || !this.web3) {
            throw new Error('Web3 not initialized. Call initialize() first.');
        }
        return this.web3;
    }

    // Get default account
    async getDefaultAccount() {
        const accounts = await this.web3.eth.getAccounts();
        return accounts[0];
    }

    // Get all accounts
    async getAccounts() {
        return await this.web3.eth.getAccounts();
    }

    // Get network ID
    async getNetworkId() {
        return await this.web3.eth.net.getId();
    }

    // Get current block number
    async getCurrentBlock() {
        return await this.web3.eth.getBlockNumber();
    }

    // Get transaction receipt
    async getTransactionReceipt(txHash) {
        return await this.web3.eth.getTransactionReceipt(txHash);
    }

    // Get balance
    async getBalance(address) {
        const balance = await this.web3.eth.getBalance(address);
        return this.web3.utils.fromWei(balance, 'ether');
    }

    // Wait for transaction
    async waitForTransaction(txHash, confirmations = 1) {
        return new Promise((resolve, reject) => {
            const checkTransaction = async () => {
                try {
                    const receipt = await this.web3.eth.getTransactionReceipt(txHash);

                    if (receipt) {
                        if (receipt.status) {
                            logger.info(`✅ Transaction confirmed: ${txHash}`);
                            resolve(receipt);
                        } else {
                            logger.error(`❌ Transaction failed: ${txHash}`);
                            reject(new Error('Transaction failed'));
                        }
                    } else {
                        setTimeout(checkTransaction, 1000);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            checkTransaction();
        });
    }

    // Check if initialized
    isInitialized() {
        return this.connected && this.contractAddresses !== null;
    }
}

// Export singleton instance
module.exports = new Web3Provider();
