const zkProofService = require('../../services/zkproof.service');
const voterService = require('../../services/voter.service');
const electionService = require('../../services/election.service');
const logger = require('../../utils/logger');

class ZKProofController {
    // Generate ZKP proof for voting
    async generateVotingProof(req, res) {
        try {
            const { electionId, candidateId } = req.body;
            const userId = req.user._id;

            // Get voter
            const voter = await voterService.getVoterByUserId(userId);
            
            if (!voter) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Voter profile not found'
                });
            }

            // Get election
            const election = await electionService.getElectionById(electionId);

            // Generate proof
            const result = await zkProofService.generateVotingProof({
                voterSecret: voter.voterSecret,
                candidateId,
                electionId: election.blockchainElectionId,
                maxCandidates: election.candidates.length
            });

            res.status(200).json({
                status: 'success',
                message: 'ZKP proof generated successfully',
                data: {
                    proof: result.proof,
                    publicSignals: result.publicSignals,
                    nullifier: result.nullifier
                }
            });
        } catch (error) {
            logger.error('Generate proof error:', error);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Verify ZKP proof
    async verifyProof(req, res) {
        try {
            const { proof, publicSignals } = req.body;

            // Validate proof structure
            if (!zkProofService.validateProofStructure(proof)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid proof structure'
                });
            }

            const isValid = await zkProofService.verifyProof(publicSignals, proof);

            res.status(200).json({
                status: 'success',
                data: {
                    valid: isValid,
                    message: isValid ? 'Proof is valid' : 'Proof is invalid'
                }
            });
        } catch (error) {
            logger.error('Verify proof error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Proof verification failed'
            });
        }
    }

    // Get verification key
    async getVerificationKey(req, res) {
        try {
            const vKey = await zkProofService.getVerificationKey();

            res.status(200).json({
                status: 'success',
                data: { verificationKey: vKey }
            });
        } catch (error) {
            logger.error('Get verification key error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get verification key'
            });
        }
    }
}

module.exports = new ZKProofController();
