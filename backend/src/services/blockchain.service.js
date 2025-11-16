const web3Provider = require('../blockchain/web3Provider');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class BlockchainService {
    constructor() {
        this.initialized = false;
        this.contracts = {};
    }

    // Initialize blockchain connection and load contracts
    async initialize() {
        try {
            logger.info('🔗 Initializing Blockchain Service...');

            // Wait for web3Provider to be initialized (happens in blockchain.config.js)
            if (!web3Provider.isInitialized()) {
                throw new Error('Web3Provider not initialized. Call from blockchain.config.js first.');
            }

            // Load contract addresses from volume
            const addresses = web3Provider.getContractAddresses();

            if (!addresses || !addresses.ElectionManager || !addresses.VotingSystem || !addresses.Verifier) {
                throw new Error('Contract addresses not loaded');
            }

            const web3 = web3Provider.getWeb3();

            // Load contract ABIs and create instances
            this.contracts.electionManager = await this.loadContract('ElectionManager', addresses.ElectionManager, web3);
            this.contracts.votingSystem = await this.loadContract('VotingSystem', addresses.VotingSystem, web3);
            this.contracts.verifier = await this.loadContract('Verifier', addresses.Verifier, web3);
            if (addresses.VoterRegistry) {
                this.contracts.voterRegistry = await this.loadContract('VoterRegistry', addresses.VoterRegistry, web3);
            }

            // Note: VoterRegistry is not in your contracts.json, so we'll skip it
            // If you have VoterRegistry, add it to the deploy script

            this.initialized = true;
            logger.info('✅ Blockchain service initialized with contracts:');
            logger.info(`   ElectionManager: ${addresses.ElectionManager}`);
            logger.info(`   VotingSystem: ${addresses.VotingSystem}`);
            logger.info(`   Verifier: ${addresses.Verifier}`);

            return true;
        } catch (error) {
            logger.error('❌ Blockchain service initialization failed:', error);
            throw error;
        }
    }

    // Load contract ABI and create instance
    async loadContract(contractName, address, web3) {
        try {
            // Try multiple paths for ABIs
            const possiblePaths = [
                // Docker: from shared volume (PREFERRED)
                path.join('/shared/abis', `${contractName}.json`),
                // Docker: contracts copied to /app/contracts
                path.join('/app/contracts', `${contractName}.json`),
                // Local dev: from blockchain build
                path.join(__dirname, `../../../blockchain/build/contracts/${contractName}.json`),
                // Local dev: alternative path
                path.join(__dirname, '../../contracts', `${contractName}.json`),
            ];

            let abiPath = null;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    abiPath = p;
                    logger.info(`   Found ABI at: ${p}`);
                    break;
                }
            }

            if (!abiPath) {
                throw new Error(`Contract ABI not found for ${contractName}. Tried: ${possiblePaths.join(', ')}`);
            }

            const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
            const contract = new web3.eth.Contract(artifact.abi, address);

            logger.info(`   ✅ Loaded ${contractName} at ${address}`);
            return contract;
        } catch (error) {
            logger.error(`Error loading contract ${contractName}:`, error);
            throw error;
        }
    }

    // Get contract instances
    getElectionManager() {
        if (!this.initialized) throw new Error('Blockchain service not initialized');
        return this.contracts.electionManager;
    }

    getVotingSystem() {
        if (!this.initialized) throw new Error('Blockchain service not initialized');
        return this.contracts.votingSystem;
    }

    getVerifier() {
        if (!this.initialized) throw new Error('Blockchain service not initialized');
        return this.contracts.verifier;
    }

    // Calculate commitment using Poseidon hash
    async calculateCommitment(voterSecret) {
        try {
            const { buildPoseidon } = require('circomlibjs');
            const poseidon = await buildPoseidon();
            const commitment = poseidon.F.toString(
                poseidon([BigInt(voterSecret)])
            );
            return commitment;
        } catch (error) {
            logger.error('Commitment calculation error:', error);
            throw error;
        }
    }

    // Calculate nullifier
    async calculateNullifier(voterSecret, electionId) {
        try {
            const { buildPoseidon } = require('circomlibjs');
            const poseidon = await buildPoseidon();
            const nullifier = poseidon.F.toString(
                poseidon([BigInt(voterSecret), BigInt(electionId)])
            );
            return nullifier;
        } catch (error) {
            logger.error('Nullifier calculation error:', error);
            throw error;
        }
    }

    // Register voter on blockchain (if you have VoterRegistry contract)
    async registerVoterOnChain(commitment) {
        try {
            const web3 = web3Provider.getWeb3();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Registering voter on chain with commitment: ${commitment}`);

            // Convert commitment BigInt string to proper bytes32 hex format
            let commitmentHex = '0x' + BigInt(commitment).toString(16).padStart(64, '0');
            logger.info(`Converted commitment to hex: ${commitmentHex}`);

            // Note: This requires VoterRegistry contract
            // If you don't have it, you may need to add it or handle differently
            if (!this.contracts.voterRegistry) {
                logger.warn('VoterRegistry contract not available, skipping on-chain registration');
                return null;
            }

            const tx = await this.contracts.voterRegistry.methods
                .registerVoter(commitmentHex)
                .send({
                    from: account,
                    gas: process.env.GAS_LIMIT || 3000000
                });

            logger.info(`✅ Voter registered on blockchain: ${tx.transactionHash}`);
            return tx.transactionHash;
        } catch (error) {
            logger.error('Register voter on chain error:', error);
            throw error;
        }
    }

    // Create election on blockchain
    async createElectionOnChain(electionData) {
        try {
            const web3 = web3Provider.getWeb3();
            const electionManager = this.getElectionManager();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Creating election on blockchain: ${electionData.title}`);

            const tx = await electionManager.methods
                .createElection(
                    electionData.title,
                    electionData.description,
                    electionData.startTime,
                    electionData.endTime,
                    electionData.candidateCount
                )
                .send({
                    from: account,
                    gas: process.env.GAS_LIMIT || 3000000
                });

            // Get election ID from event
            const electionId = tx.events.ElectionCreated.returnValues.electionId;
            logger.info(`✅ Election created on blockchain. ID: ${electionId}, TxHash: ${tx.transactionHash}`);

            return parseInt(electionId);
        } catch (error) {
            logger.error('Create election on chain error:', error);
            throw error;
        }
    }

    // Start registration phase
    async startRegistration(electionId) {
        try {
            const electionManager = this.getElectionManager();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Starting registration for election ${electionId}`);

            const tx = await electionManager.methods
                .startRegistration(electionId)
                .send({
                    from: account,
                    gas: process.env.GAS_LIMIT || 3000000
                });

            logger.info(`✅ Registration started: ${tx.transactionHash}`);
            return tx.transactionHash;
        } catch (error) {
            logger.error('Start registration error:', error);
            throw error;
        }
    }

    // Start voting phase
    async startVoting(electionId) {
        try {
            const electionManager = this.getElectionManager();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Starting voting for election ${electionId}`);

            const tx = await electionManager.methods
                .startVoting(electionId)
                .send({
                    from: account,
                    gas: process.env.GAS_LIMIT || 3000000
                });

            logger.info(`✅ Voting started: ${tx.transactionHash}`);
            return tx.transactionHash;
        } catch (error) {
            logger.error('Start voting error:', error);
            throw error;
        }
    }

    // End election
    async endElection(electionId) {
        try {
            const electionManager = this.getElectionManager();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Ending election ${electionId}`);

            const tx = await electionManager.methods
                .endElection(electionId)
                .send({
                    from: account,
                    gas: process.env.GAS_LIMIT || 3000000
                });

            logger.info(`✅ Election ended: ${tx.transactionHash}`);
            return tx.transactionHash;
        } catch (error) {
            logger.error('End election error:', error);
            throw error;
        }
    }

    // Cast vote with ZKP
    async castVote({ electionId, candidateId, proof, publicSignals }) {
        try {
            const votingSystem = this.getVotingSystem();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Casting vote for election ${electionId}, candidate ${candidateId}`);

            // Format proof components
            const a = proof.pi_a.slice(0, 2);
            const b = [
                proof.pi_b[0].slice(0, 2).reverse(),
                proof.pi_b[1].slice(0, 2).reverse()
            ];
            const c = proof.pi_c.slice(0, 2);

            const tx = await votingSystem.methods
                .castVote(
                    electionId,
                    candidateId,
                    a,
                    b,
                    c,
                    publicSignals
                )
                .send({
                    from: account,
                    gas: process.env.GAS_LIMIT || 5000000
                });

            logger.info(`✅ Vote cast successfully: ${tx.transactionHash}`);
            logger.info(`   Gas used: ${tx.gasUsed}`);
            return tx.transactionHash;
        } catch (error) {
            logger.error('Cast vote error:', error);
            throw error;
        }
    }

    // Get election results
    async getElectionResults(electionId, candidateCount) {
        try {
            const votingSystem = this.getVotingSystem();

            logger.info(`Fetching results for election ${electionId}`);

            const results = await votingSystem.methods
                .getResults(electionId, candidateCount)
                .call();

            // Convert to array of numbers
            const resultsArray = results.map(count => parseInt(count));
            logger.info(`✅ Results fetched:`, resultsArray);

            return resultsArray;
        } catch (error) {
            logger.error('Get results error:', error);
            throw error;
        }
    }

    // Get election details from blockchain
    async getElectionDetails(electionId) {
        try {
            const electionManager = this.getElectionManager();

            const details = await electionManager.methods
                .getElectionDetails(electionId)
                .call();

            return {
                title: details.title,
                description: details.description,
                startTime: new Date(parseInt(details.startTime) * 1000),
                endTime: new Date(parseInt(details.endTime) * 1000),
                candidateCount: parseInt(details.candidateCount),
                state: parseInt(details.state)
            };
        } catch (error) {
            logger.error('Get election details error:', error);
            throw error;
        }
    }

    // Verify transaction
    async verifyTransaction(txHash) {
        try {
            const receipt = await web3Provider.getTransactionReceipt(txHash);
            return receipt && receipt.status;
        } catch (error) {
            logger.error('Verify transaction error:', error);
            return false;
        }
    }

    // Get transaction details
    async getTransactionDetails(txHash) {
        try {
            const web3 = web3Provider.getWeb3();
            const [receipt, transaction] = await Promise.all([
                web3.eth.getTransactionReceipt(txHash),
                web3.eth.getTransaction(txHash)
            ]);

            if (!receipt || !transaction) {
                return null;
            }

            return {
                hash: txHash,
                blockNumber: receipt.blockNumber,
                from: transaction.from,
                to: transaction.to,
                gasUsed: receipt.gasUsed,
                status: receipt.status,
                timestamp: await this.getBlockTimestamp(receipt.blockNumber)
            };
        } catch (error) {
            logger.error('Get transaction details error:', error);
            throw error;
        }
    }

    // Get block timestamp
    async getBlockTimestamp(blockNumber) {
        try {
            const web3 = web3Provider.getWeb3();
            const block = await web3.eth.getBlock(blockNumber);
            return new Date(parseInt(block.timestamp) * 1000);
        } catch (error) {
            logger.error('Get block timestamp error:', error);
            return null;
        }
    }
}

module.exports = new BlockchainService();
