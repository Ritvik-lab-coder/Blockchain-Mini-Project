const express = require('express');
const router = express.Router();
const votingController = require('../controllers/voting.controller');
const { authenticate, isVoter } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const { votingLimiter } = require('../middlewares/rateLimiter.middleware');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Cast vote
router.post(
    '/cast',
    authenticate,
    isVoter,
    votingLimiter,
    validate(schemas.castVote),
    asyncHandler(votingController.castVote)
);

// Verify vote by transaction hash
router.get(
    '/verify/:transactionHash',
    asyncHandler(votingController.verifyVote)
);

// Get voting history for current user
router.get(
    '/history',
    authenticate,
    isVoter,
    asyncHandler(votingController.getMyVotingHistory)
);

// Check if current user can vote in specific election
router.get(
    '/can-vote/:electionId',
    authenticate,
    isVoter,
    asyncHandler(votingController.canVote)
);

module.exports = router;
