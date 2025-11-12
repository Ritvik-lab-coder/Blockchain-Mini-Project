const voterService = require('../../services/voter.service');
const logger = require('../../utils/logger');

class VoterController {
    // Register as voter
    async registerVoter(req, res) {
        try {
            const userId = req.user._id;
            const userData = req.body;

            const voter = await voterService.registerVoter(userId, userData);

            res.status(201).json({
                status: 'success',
                message: 'Voter registration submitted. Awaiting approval.',
                data: {
                    voter: {
                        id: voter._id,
                        status: voter.status,
                        commitment: voter.voterCommitment,
                        createdAt: voter.createdAt
                    }
                }
            });
        } catch (error) {
            logger.error('Register voter error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Approve voter (Admin only)
    async approveVoter(req, res) {
        try {
            const { voterId } = req.params;
            const adminId = req.user._id;

            const voter = await voterService.approveVoter(voterId, adminId);

            res.status(200).json({
                status: 'success',
                message: 'Voter approved and registered on blockchain',
                data: {
                    voter: {
                        id: voter._id,
                        status: voter.status,
                        commitment: voter.voterCommitment,
                        txHash: voter.registrationTxHash,
                        registrationDate: voter.registrationDate
                    }
                }
            });
        } catch (error) {
            logger.error('Approve voter error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Reject voter (Admin only)
    async rejectVoter(req, res) {
        try {
            const { voterId } = req.params;
            const { reason } = req.body;
            const adminId = req.user._id;

            const voter = await voterService.rejectVoter(voterId, adminId, reason);

            res.status(200).json({
                status: 'success',
                message: 'Voter registration rejected',
                data: {
                    voter: {
                        id: voter._id,
                        status: voter.status
                    }
                }
            });
        } catch (error) {
            logger.error('Reject voter error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Get voter details
    async getVoterDetails(req, res) {
        try {
            const { voterId } = req.params;

            const voter = await voterService.getVoterDetails(voterId);

            res.status(200).json({
                status: 'success',
                data: { voter }
            });
        } catch (error) {
            logger.error('Get voter details error:', error);
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Get current user's voter profile
    async getMyVoterProfile(req, res) {
        try {
            const userId = req.user._id;

            const voter = await voterService.getVoterByUserId(userId);

            if (!voter) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Voter profile not found. Please register as a voter.'
                });
            }

            res.status(200).json({
                status: 'success',
                data: { voter }
            });
        } catch (error) {
            logger.error('Get my voter profile error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get voter profile'
            });
        }
    }

    // Get all voters (Admin only)
    async getAllVoters(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;

            const filter = status ? { status } : {};
            
            const result = await voterService.getAllVoters(
                filter,
                parseInt(page),
                parseInt(limit)
            );

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Get all voters error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get voters'
            });
        }
    }

    // Check if user has voted in specific election
    async hasVoted(req, res) {
        try {
            const { voterId, electionId } = req.params;

            const hasVoted = await voterService.hasVotedInElection(voterId, electionId);

            res.status(200).json({
                status: 'success',
                data: { hasVoted }
            });
        } catch (error) {
            logger.error('Check vote status error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to check vote status'
            });
        }
    }
}

module.exports = new VoterController();
