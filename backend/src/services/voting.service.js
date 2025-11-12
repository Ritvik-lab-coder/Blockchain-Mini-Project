const { Voter, Election, VoteRecord, AuditLog } = require('../models');
const zkProofService = require('./zkproof.service');
const blockchainService = require('./blockchain.service');
const logger = require('../utils/logger');

class VotingService {
    // Cast vote with ZKP
    async castVote(voterId, electionId, candidateId, ipAddress) {
        try {
            // Get voter
            const voter = await Voter.findById(voterId).select('+voterSecret');
            if (!voter) {
                throw new Error('Voter not found');
            }

            if (voter.status !== 'approved') {
                throw new Error('Voter not approved');
            }

            // Get election
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.state !== 'voting') {
                throw new Error('Election is not in voting state');
            }

            // Check if voter is eligible
            if (!election.isVoterEligible(voterId)) {
                throw new Error('Voter not eligible for this election');
            }

            // Check if already voted
            if (voter.hasVotedIn(electionId)) {
                throw new Error('Already voted in this election');
            }

            // Validate candidate
            if (candidateId >= election.candidates.length) {
                throw new Error('Invalid candidate ID');
            }

            logger.info(`Generating ZKP for voter ${voterId} in election ${electionId}`);

            // Generate ZKP proof
            const { proof, publicSignals, nullifier } = await zkProofService.generateVotingProof({
                voterSecret: voter.voterSecret,
                candidateId,
                electionId: election.blockchainElectionId,
                maxCandidates: election.candidates.length
            });

            logger.info(`ZKP generated, submitting to blockchain...`);

            // Submit vote to blockchain
            const txHash = await blockchainService.castVote({
                electionId: election.blockchainElectionId,
                candidateId,
                proof,
                publicSignals
            });

            logger.info(`Vote submitted to blockchain: ${txHash}`);

            // Record vote in database
            const voteRecord = new VoteRecord({
                electionId,
                voterId,
                nullifier,
                candidateId,
                zkProof: proof,
                transactionHash: txHash,
                verificationStatus: 'verified',
                ipAddress
            });
            await voteRecord.save();

            // Update voter record
            voter.recordVote(electionId, nullifier, txHash);
            await voter.save();

            // Update election vote count
            election.incrementVoteCount(candidateId);
            await election.save();

            // Log vote cast
            await AuditLog.log({
                action: 'vote_cast',
                userId: voter.userId,
                targetId: election._id,
                targetModel: 'Election',
                description: `Vote cast in election: ${election.title}`,
                blockchainTxHash: txHash,
                ipAddress,
                metadata: {
                    nullifier,
                    electionId: election.blockchainElectionId
                }
            });

            logger.info(`Vote recorded successfully for election ${election.title}`);

            return {
                success: true,
                transactionHash: txHash,
                message: 'Vote cast successfully'
            };
        } catch (error) {
            logger.error('Vote casting error:', error);
            
            // Log failed attempt
            await AuditLog.log({
                action: 'vote_cast',
                userId: voterId,
                targetId: electionId,
                targetModel: 'Election',
                description: `Failed vote attempt: ${error.message}`,
                status: 'failure',
                errorMessage: error.message,
                ipAddress
            });

            throw error;
        }
    }

    // Verify vote by transaction hash
    async verifyVote(transactionHash) {
        try {
            const voteRecord = await VoteRecord.findOne({ transactionHash })
                .populate('electionId', 'title')
                .populate('voterId', 'userId');

            if (!voteRecord) {
                throw new Error('Vote not found');
            }

            // Verify on blockchain
            const isValid = await blockchainService.verifyTransaction(transactionHash);

            return {
                exists: true,
                verified: isValid,
                election: voteRecord.electionId.title,
                timestamp: voteRecord.timestamp,
                nullifier: voteRecord.nullifier
            };
        } catch (error) {
            logger.error('Vote verification error:', error);
            throw error;
        }
    }

    // Get voter's voting history
    async getVotingHistory(voterId) {
        try {
            const voter = await Voter.findById(voterId)
                .populate('votedElections.electionId', 'title startTime endTime');

            if (!voter) {
                throw new Error('Voter not found');
            }

            return voter.votedElections;
        } catch (error) {
            logger.error('Get voting history error:', error);
            throw error;
        }
    }

    // Get election statistics
    async getElectionStatistics(electionId) {
        try {
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            const voteRecords = await VoteRecord.countDocuments({ electionId });

            const turnoutPercentage = election.totalVotersRegistered > 0
                ? (election.totalVotesCast / election.totalVotersRegistered) * 100
                : 0;

            return {
                totalRegistered: election.totalVotersRegistered,
                totalVoted: election.totalVotesCast,
                turnoutPercentage: turnoutPercentage.toFixed(2),
                state: election.state,
                candidates: election.candidates.length
            };
        } catch (error) {
            logger.error('Get statistics error:', error);
            throw error;
        }
    }
}

module.exports = new VotingService();
