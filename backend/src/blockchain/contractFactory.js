const fs = require('fs');
const path = require('path');
const web3Provider = require('./web3Provider');
const logger = require('../utils/logger');

class ContractFactory {
    constructor() {
        this.contracts = {};
        this.abis = {};
    }

    // Load contract ABI
    loadABI(contractName) {
        try {
            const abiPath = path.join(
                __dirname,
                '../../../blockchain/build/contracts',
                `${contractName}.json`
            );

            const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
            this.abis[contractName] = contractJson.abi;
            
            logger.info(`✅ Loaded ABI for ${contractName}`);
            return contractJson.abi;
        } catch (error) {
            logger.error(`❌ Failed to load ABI for ${contractName}:`, error);
            throw error;
        }
    }

    // Get contract instance
    getContract(contractName, address) {
        const web3 = web3Provider.getWeb3();
        
        if (!this.abis[contractName]) {
            this.loadABI(contractName);
        }

        const contract = new web3.eth.Contract(this.abis[contractName], address);
        this.contracts[contractName] = contract;
        
        return contract;
    }

    // Initialize all contracts
    initializeContracts() {
        try {
            const contracts = {
                verifier: this.getContract('Groth16Verifier', process.env.CONTRACT_VERIFIER),
                voterRegistry: this.getContract('VoterRegistry', process.env.CONTRACT_VOTER_REGISTRY),
                electionManager: this.getContract('ElectionManager', process.env.CONTRACT_ELECTION_MANAGER),
                votingSystem: this.getContract('VotingSystem', process.env.CONTRACT_VOTING_SYSTEM)
            };

            logger.info('✅ All contracts initialized');
            return contracts;
        } catch (error) {
            logger.error('❌ Contract initialization failed:', error);
            throw error;
        }
    }

    // Get specific contract
    getVoterRegistry() {
        return this.getContract('VoterRegistry', process.env.CONTRACT_VOTER_REGISTRY);
    }

    getElectionManager() {
        return this.getContract('ElectionManager', process.env.CONTRACT_ELECTION_MANAGER);
    }

    getVotingSystem() {
        return this.getContract('VotingSystem', process.env.CONTRACT_VOTING_SYSTEM);
    }

    getVerifier() {
        return this.getContract('Groth16Verifier', process.env.CONTRACT_VERIFIER);
    }
}

// Export singleton instance
module.exports = new ContractFactory();
