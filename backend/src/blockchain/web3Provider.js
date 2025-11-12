const { Web3 } = require('web3');
const logger = require('../utils/logger');

class Web3Provider {
    constructor() {
        this.web3 = null;
        this.connected = false;
    }

    // Initialize Web3 connection
    async initialize() {
        try {
            const ganacheUrl = process.env.GANACHE_URL || 'http://localhost:7545';
            
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
}

// Export singleton instance
module.exports = new Web3Provider();
