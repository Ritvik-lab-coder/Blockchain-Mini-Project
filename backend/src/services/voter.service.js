const { Voter, User, AuditLog } = require('../models');
const blockchainService = require('./blockchain.service');
const logger = require('../utils/logger');
const crypto = require('crypto');

class VoterService {
    // Generate voter secret (deterministic from user data)
    generateVoterSecret(userId) {
        return BigInt('0x' + crypto
            .createHash('sha256')
            .update(userId.toString() + process.env.JWT_SECRET)
            .digest('hex')
        ).toString();
    }

    // Register voter
    async registerVoter(userId, userData) {
        try {
            // Check if voter already registered
            const existingVoter = await Voter.findOne({ userId });
            if (existingVoter) {
                throw new Error('Voter already registered');
            }

            // Generate voter secret
            const voterSecret = this.generateVoterSecret(userId);

            // Calculate commitment using blockchain service
            const voterCommitment = await blockchainService.calculateCommitment(voterSecret);

            // Create voter record
            const voter = new Voter({
                userId,
                voterSecret,
                voterCommitment,
                status: 'pending',
                ...userData
            });

            await voter.save();

            // Log voter registration
            await AuditLog.log({
                action: 'voter_register',
                userId,
                targetId: voter._id,
                targetModel: 'Voter',
                description: 'Voter registration initiated',
                metadata: { commitment: voterCommitment }
            });

            logger.info(`Voter registered: ${voterCommitment}`);

            return voter;
        } catch (error) {
            logger.error('Voter registration error:', error);
            throw error;
        }
    }

    // Approve voter and register on blockchain
    async approveVoter(voterId, adminId) {
        try {
            const voter = await Voter.findById(voterId).select('+voterSecret');
            if (!voter) {
                throw new Error('Voter not found');
            }

            if (voter.status === 'approved') {
                throw new Error('Voter already approved');
            }

            // Register on blockchain
            const txHash = await blockchainService.registerVoterOnChain(voter.voterCommitment);

            // Update voter status
            voter.status = 'approved';
            voter.isRegisteredOnChain = true;
            voter.registrationTxHash = txHash;
            voter.registrationDate = new Date();
            await voter.save();

            // Log approval
            await AuditLog.log({
                action: 'voter_approve',
                userId: adminId,
                targetId: voter._id,
                targetModel: 'Voter',
                description: `Voter approved and registered on blockchain`,
                blockchainTxHash: txHash,
                metadata: { commitment: voter.voterCommitment }
            });

            logger.info(`Voter approved: ${voter.voterCommitment}, TxHash: ${txHash}`);

            return voter;
        } catch (error) {
            logger.error('Voter approval error:', error);
            throw error;
        }
    }

    // Get voter by user ID
    async getVoterByUserId(userId) {
        try {
            const voter = await Voter.findOne({ userId }).populate('userId', 'email firstName lastName');
            return voter;
        } catch (error) {
            logger.error('Get voter error:', error);
            throw error;
        }
    }

    // Get voter details
    async getVoterDetails(voterId) {
        try {
            const voter = await Voter.findById(voterId)
                .populate('userId', 'email firstName lastName')
                .populate('eligibleElections', 'title startTime endTime');
            
            if (!voter) {
                throw new Error('Voter not found');
            }

            return voter;
        } catch (error) {
            logger.error('Get voter details error:', error);
            throw error;
        }
    }

    // Check if voter has voted in election
    async hasVotedInElection(voterId, electionId) {
        try {
            const voter = await Voter.findById(voterId);
            if (!voter) {
                throw new Error('Voter not found');
            }

            return voter.hasVotedIn(electionId);
        } catch (error) {
            logger.error('Check vote status error:', error);
            throw error;
        }
    }

    // Get all voters (admin only)
    async getAllVoters(filter = {}, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            const voters = await Voter.find(filter)
                .populate('userId', 'email firstName lastName')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            const total = await Voter.countDocuments(filter);

            return {
                voters,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Get all voters error:', error);
            throw error;
        }
    }

    // Reject voter
    async rejectVoter(voterId, adminId, reason) {
        try {
            const voter = await Voter.findById(voterId);
            if (!voter) {
                throw new Error('Voter not found');
            }

            voter.status = 'rejected';
            await voter.save();

            await AuditLog.log({
                action: 'voter_reject',
                userId: adminId,
                targetId: voter._id,
                targetModel: 'Voter',
                description: `Voter rejected: ${reason}`,
                metadata: { reason }
            });

            logger.info(`Voter rejected: ${voter.voterCommitment}`);

            return voter;
        } catch (error) {
            logger.error('Voter rejection error:', error);
            throw error;
        }
    }
}

module.exports = new VoterService();
