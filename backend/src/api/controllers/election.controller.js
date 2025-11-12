const electionService = require('../../services/election.service');
const logger = require('../../utils/logger');
const voterService = require('../../services/voter.service')

class ElectionController {
    // Create election (Admin only)
    async createElection(req, res) {
        try {
            const electionData = req.body;
            const createdBy = req.user._id;

            const election = await electionService.createElection(electionData, createdBy);

            res.status(201).json({
                status: 'success',
                message: 'Election created successfully',
                data: { election }
            });
        } catch (error) {
            logger.error('Create election error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Get all elections
    async getAllElections(req, res) {
        try {
            const { state, page = 1, limit = 10 } = req.query;

            const filter = state ? { state } : {};

            const result = await electionService.getAllElections(
                filter,
                parseInt(page),
                parseInt(limit)
            );

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Get all elections error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get elections'
            });
        }
    }

    // Get election by ID
    async getElectionById(req, res) {
        try {
            const { electionId } = req.params;

            const election = await electionService.getElectionById(electionId);

            res.status(200).json({
                status: 'success',
                data: { election }
            });
        } catch (error) {
            logger.error('Get election error:', error);
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Start registration phase (Admin only)
    async startRegistration(req, res) {
        try {
            const { electionId } = req.params;
            const adminId = req.user._id;

            const election = await electionService.startRegistration(electionId, adminId);

            res.status(200).json({
                status: 'success',
                message: 'Registration phase started',
                data: { election }
            });
        } catch (error) {
            logger.error('Start registration error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Start voting phase (Admin only)
    async startVoting(req, res) {
        try {
            const { electionId } = req.params;
            const adminId = req.user._id;

            const election = await electionService.startVoting(electionId, adminId);

            res.status(200).json({
                status: 'success',
                message: 'Voting phase started',
                data: { election }
            });
        } catch (error) {
            logger.error('Start voting error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // End election (Admin only)
    async endElection(req, res) {
        try {
            const { electionId } = req.params;
            const adminId = req.user._id;

            const election = await electionService.endElection(electionId, adminId);

            res.status(200).json({
                status: 'success',
                message: 'Election ended',
                data: { election }
            });
        } catch (error) {
            logger.error('End election error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Add eligible voter to election (Admin only)
    async addEligibleVoter(req, res) {
        try {
            const { electionId, voterId } = req.params;
            const adminId = req.user._id;

            const election = await electionService.addEligibleVoter(
                electionId,
                voterId,
                adminId
            );

            res.status(200).json({
                status: 'success',
                message: 'Voter added to election',
                data: {
                    electionId: election._id,
                    totalVotersRegistered: election.totalVotersRegistered
                }
            });
        } catch (error) {
            logger.error('Add eligible voter error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Get election results
    async getResults(req, res) {
        try {
            const { electionId } = req.params;

            const results = await electionService.getResults(electionId);

            res.status(200).json({
                status: 'success',
                data: results
            });
        } catch (error) {
            logger.error('Get results error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Get election statistics
    async getStatistics(req, res) {
        try {
            const { electionId } = req.params;

            const votingService = require('../../services/voting.service');
            const statistics = await votingService.getElectionStatistics(electionId);

            res.status(200).json({
                status: 'success',
                data: statistics
            });
        } catch (error) {
            logger.error('Get statistics error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get statistics'
            });
        }
    }

    // Register voter for election
    async registerForElection(req, res) {
        try {
            const { electionId } = req.params;
            const userId = req.user._id;

            const election = await electionService.getElectionById(electionId);

            if (!election) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Election not found'
                });
            }

            if (election.state !== 'registration') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Election is not in registration phase'
                });
            }

            // Get voter profile
            const voter = await voterService.getVoterByUserId(userId);

            if (!voter) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Voter profile not found. Please register as a voter first.'
                });
            }

            if (voter.status !== 'approved') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your voter registration is not approved yet'
                });
            }

            // Check if already registered
            if (election.eligibleVoters.includes(voter._id.toString())) {
                return res.status(400).json({
                    status: 'error',
                    message: 'You are already registered for this election'
                });
            }

            // Add voter to election
            election.eligibleVoters.push(voter._id);
            election.totalVotersRegistered += 1;
            await election.save();

            // Add election to voter's eligible elections
            if (!voter.eligibleElections.includes(electionId)) {
                voter.eligibleElections.push(electionId);
                await voter.save();
            }

            logger.info(`✅ Voter ${voter._id} registered for election ${electionId}`);

            res.status(200).json({
                status: 'success',
                data: {
                    message: 'Successfully registered for election',
                    election
                }
            });
        } catch (error) {
            logger.error('Register for election error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to register for election'
            });
        }
    }

    // Check registration status
    async checkRegistration(req, res) {
        try {
            const { electionId } = req.params;
            const userId = req.user._id;

            const election = await electionService.getElectionById(electionId);

            if (!election) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Election not found'
                });
            }

            const voter = await voterService.getVoterByUserId(userId);

            if (!voter) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        isRegistered: false,
                        hasVoted: false,
                        canVote: false,
                        reason: 'Not registered as voter'
                    }
                });
            }

            const isRegistered = election.eligibleVoters.includes(voter._id.toString());
            const hasVoted = voter.votedElections.some(v => v.electionId === electionId);
            const canVote = isRegistered && !hasVoted && election.state === 'voting';

            res.status(200).json({
                status: 'success',
                data: {
                    isRegistered,
                    hasVoted,
                    canVote,
                    electionState: election.state
                }
            });
        } catch (error) {
            logger.error('Check registration error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to check registration'
            });
        }
    }

}

module.exports = new ElectionController();
