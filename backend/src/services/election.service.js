const { Election, Voter, AuditLog } = require('../models');
const blockchainService = require('./blockchain.service');
const logger = require('../utils/logger');

class ElectionService {
    // Create new election
    async createElection(electionData, createdBy) {
        try {
            // Validate candidates
            if (!electionData.candidates || electionData.candidates.length === 0) {
                throw new Error('At least one candidate is required');
            }

            // Assign IDs to candidates
            electionData.candidates = electionData.candidates.map((candidate, index) => ({
                ...candidate,
                id: index
            }));

            // Create election in database
            const election = new Election({
                ...electionData,
                createdBy,
                state: 'created'
            });

            await election.save();

            // Create election on blockchain
            const blockchainElectionId = await blockchainService.createElectionOnChain({
                title: election.title,
                description: election.description,
                startTime: Math.floor(election.startTime.getTime() / 1000),
                endTime: Math.floor(election.endTime.getTime() / 1000),
                candidateCount: election.candidates.length
            });

            // Update election with blockchain ID
            election.blockchainElectionId = blockchainElectionId;
            await election.save();

            // Log election creation
            await AuditLog.log({
                action: 'election_create',
                userId: createdBy,
                targetId: election._id,
                targetModel: 'Election',
                description: `Election created: ${election.title}`,
                metadata: {
                    blockchainElectionId,
                    candidateCount: election.candidates.length
                }
            });

            logger.info(`Election created: ${election.title}, Blockchain ID: ${blockchainElectionId}`);

            return election;
        } catch (error) {
            logger.error('Election creation error:', error);
            throw error;
        }
    }

    // Start registration phase
    async startRegistration(electionId, adminId) {
        try {
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.state !== 'created') {
                throw new Error('Election must be in created state');
            }

            // Update blockchain
            await blockchainService.startRegistration(election.blockchainElectionId);

            // Update election state
            election.state = 'registration';
            await election.save();

            await AuditLog.log({
                action: 'election_start',
                userId: adminId,
                targetId: election._id,
                targetModel: 'Election',
                description: `Registration started for election: ${election.title}`
            });

            logger.info(`Registration started: ${election.title}`);

            return election;
        } catch (error) {
            logger.error('Start registration error:', error);
            throw error;
        }
    }

    // Start voting phase
    async startVoting(electionId, adminId) {
        try {
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.state !== 'registration') {
                throw new Error('Election must be in registration state');
            }

            // Update blockchain
            await blockchainService.startVoting(election.blockchainElectionId);

            // Update election state
            election.state = 'voting';
            await election.save();

            await AuditLog.log({
                action: 'election_start',
                userId: adminId,
                targetId: election._id,
                targetModel: 'Election',
                description: `Voting started for election: ${election.title}`
            });

            logger.info(`Voting started: ${election.title}`);

            return election;
        } catch (error) {
            logger.error('Start voting error:', error);
            throw error;
        }
    }

    // End election
    async endElection(electionId, adminId) {
        try {
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.state !== 'voting') {
                throw new Error('Election must be in voting state');
            }

            // Update blockchain
            await blockchainService.endElection(election.blockchainElectionId);

            // Fetch and store results
            const results = await blockchainService.getElectionResults(
                election.blockchainElectionId,
                election.candidates.length
            );

            // Update election
            election.state = 'ended';
            election.results = new Map(
                results.map((count, index) => [index.toString(), count])
            );
            election.isResultsPublished = true;
            await election.save();

            await AuditLog.log({
                action: 'election_end',
                userId: adminId,
                targetId: election._id,
                targetModel: 'Election',
                description: `Election ended: ${election.title}`,
                metadata: { totalVotes: election.totalVotesCast }
            });

            logger.info(`Election ended: ${election.title}`);

            return election;
        } catch (error) {
            logger.error('End election error:', error);
            throw error;
        }
    }

    // Get election details
    async getElectionById(electionId) {
        try {
            const election = await Election.findById(electionId)
                .populate('createdBy', 'email firstName lastName');
            
            if (!election) {
                throw new Error('Election not found');
            }

            return election;
        } catch (error) {
            logger.error('Get election error:', error);
            throw error;
        }
    }

    // Get all elections
    async getAllElections(filter = {}, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            const elections = await Election.find(filter)
                .populate('createdBy', 'email firstName lastName')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            const total = await Election.countDocuments(filter);

            return {
                elections,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Get all elections error:', error);
            throw error;
        }
    }

    // Add eligible voter to election
    async addEligibleVoter(electionId, voterId, adminId) {
        try {
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            const voter = await Voter.findById(voterId);
            if (!voter) {
                throw new Error('Voter not found');
            }

            if (voter.status !== 'approved') {
                throw new Error('Voter must be approved');
            }

            election.addEligibleVoter(voterId);
            await election.save();

            // Add to voter's eligible elections
            if (!voter.eligibleElections.includes(electionId)) {
                voter.eligibleElections.push(electionId);
                await voter.save();
            }

            logger.info(`Voter ${voterId} added to election ${election.title}`);

            return election;
        } catch (error) {
            logger.error('Add eligible voter error:', error);
            throw error;
        }
    }

    // Get election results
    async getResults(electionId) {
        try {
            const election = await Election.findById(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.state !== 'ended') {
                throw new Error('Election has not ended yet');
            }

            // Format results with candidate details
            const results = election.candidates.map(candidate => ({
                candidateId: candidate.id,
                name: candidate.name,
                party: candidate.party,
                votes: election.results.get(candidate.id.toString()) || 0
            }));

            return {
                election: {
                    id: election._id,
                    title: election.title,
                    totalVotesCast: election.totalVotesCast,
                    totalVotersRegistered: election.totalVotersRegistered
                },
                results
            };
        } catch (error) {
            logger.error('Get results error:', error);
            throw error;
        }
    }
}

module.exports = new ElectionService();
