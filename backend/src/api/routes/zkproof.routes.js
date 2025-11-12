const express = require('express');
const router = express.Router();
const zkproofController = require('../controllers/zkproof.controller');
const { authenticate, isVoter } = require('../middlewares/auth.middleware');
const { zkpLimiter } = require('../middlewares/rateLimiter.middleware');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Generate ZKP proof for voting
router.post(
    '/generate',
    authenticate,
    isVoter,
    zkpLimiter,
    asyncHandler(zkproofController.generateVotingProof)
);

// Verify ZKP proof
router.post(
    '/verify',
    zkpLimiter,
    asyncHandler(zkproofController.verifyProof)
);

// Get verification key (public)
router.get(
    '/verification-key',
    asyncHandler(zkproofController.getVerificationKey)
);

module.exports = router;
