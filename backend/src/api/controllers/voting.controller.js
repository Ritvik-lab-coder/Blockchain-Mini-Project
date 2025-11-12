const votingService = require('../../services/voting.service');
const voterService = require('../../services/voter.service');
const logger = require('../../utils/logger');

class VotingController {
    // Cast vote
    async castVote(req, res) {
        try {
            const { electionId, candidateId } = req.body;
            const userId = req.user._id;
            const ipAddress = req.ip;

            // Get voter
            const voter = await voterService.getVoterByUserId(userId);
            
            if (!voter) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Voter profile not found. Please register as a voter first.'
                });
            }

            // Cast vote
            const result = await votingService.castVote(
                voter._id,
                electionId,
                candidateId,
                ipAddress
            );

            res.status(200).json({
                status: 'success',
                message: 'Vote cast successfully',
                data: result
            });
        } catch (error) {
            logger.error('Cast vote error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Verify vote by transaction hash
    async verifyVote(req, res) {
        try {
            const { transactionHash } = req.params;

            const result = await votingService.verifyVote(transactionHash);

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Verify vote error:', error);
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Get voting history for current user
    async getMyVotingHistory(req, res) {
        try {
            const userId = req.user._id;

            const voter = await voterService.getVoterByUserId(userId);
            
            if (!voter) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Voter profile not found'
                });
            }

            const history = await votingService.getVotingHistory(voter._id);

            res.status(200).json({
                status: 'success',
                data: { history }
            });
        } catch (error) {
            logger.error('Get voting history error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get voting history'
            });
        }
    }

    // Check if current user can vote in election
    async canVote(req, res) {
        try {
            const { electionId } = req.params;
            const userId = req.user._id;

            const voter = await voterService.getVoterByUserId(userId);
            
            if (!voter) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        canVote: false,
                        reason: 'Not registered as voter'
                    }
                });
            }

            if (voter.status !== 'approved') {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        canVote: false,
                        reason: 'Voter not approved'
                    }
                });
            }

            const hasVoted = await voterService.hasVotedInElection(voter._id, electionId);

            if (hasVoted) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        canVote: false,
                        reason: 'Already voted in this election'
                    }
                });
            }

            res.status(200).json({
                status: 'success',
                data: {
                    canVote: true,
                    voterId: voter._id
                }
            });
        } catch (error) {
            logger.error('Check can vote error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to check voting eligibility'
            });
        }
    }
}

module.exports = new VotingController();
