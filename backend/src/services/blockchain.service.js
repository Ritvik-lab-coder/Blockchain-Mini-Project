const web3Provider = require('../blockchain/web3Provider');
const contractFactory = require('../blockchain/contractFactory');
const logger = require('../utils/logger');

class BlockchainService {
    constructor() {
        this.initialized = false;
    }

    // Initialize blockchain connection
    async initialize() {
        try {
            await web3Provider.initialize();
            contractFactory.initializeContracts();
            this.initialized = true;
            logger.info('✅ Blockchain service initialized');
        } catch (error) {
            logger.error('❌ Blockchain service initialization failed:', error);
            throw error;
        }
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

    // Register voter on blockchain
    // Register voter on blockchain
    async registerVoterOnChain(commitment) {
        try {
            const web3 = web3Provider.getWeb3();
            const voterRegistry = contractFactory.getVoterRegistry();
            const account = await web3Provider.getDefaultAccount();

            logger.info(`Registering voter on chain with commitment: ${commitment}`);

            // Convert commitment BigInt string to proper bytes32 hex format
            // The commitment is a large number as a string, convert it to hex
            let commitmentHex = '0x' + BigInt(commitment).toString(16).padStart(64, '0');

            logger.info(`Converted commitment to hex: ${commitmentHex}`);

            const tx = await voterRegistry.methods
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
            const electionManager = contractFactory.getElectionManager();
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
            const electionManager = contractFactory.getElectionManager();
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
            const electionManager = contractFactory.getElectionManager();
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
            const electionManager = contractFactory.getElectionManager();
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
            const votingSystem = contractFactory.getVotingSystem();
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
            const votingSystem = contractFactory.getVotingSystem();

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

    // Check if voter is registered
    async isVoterRegistered(commitment) {
        try {
            const web3 = web3Provider.getWeb3();
            const voterRegistry = contractFactory.getVoterRegistry();

            // Convert to proper hex format
            const commitmentHex = '0x' + BigInt(commitment).toString(16).padStart(64, '0');

            const isRegistered = await voterRegistry.methods
                .isVoterRegistered(commitmentHex)
                .call();

            return isRegistered;
        } catch (error) {
            logger.error('Check voter registration error:', error);
            throw error;
        }
    }

    // Check if nullifier is used
    async isNullifierUsed(nullifier) {
        try {
            const web3 = web3Provider.getWeb3();
            const voterRegistry = contractFactory.getVoterRegistry();

            // Convert to proper hex format
            const nullifierHex = '0x' + BigInt(nullifier).toString(16).padStart(64, '0');

            const isUsed = await voterRegistry.methods
                .isNullifierUsed(nullifierHex)
                .call();

            return isUsed;
        } catch (error) {
            logger.error('Check nullifier error:', error);
            throw error;
        }
    }


    // Get election details from blockchain
    async getElectionDetails(electionId) {
        try {
            const electionManager = contractFactory.getElectionManager();

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
