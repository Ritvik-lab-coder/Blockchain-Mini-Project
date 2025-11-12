const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voter.controller');
const { authenticate, isAdmin, isVoter } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Voter registration (authenticated users)
router.post(
    '/register',
    authenticate,
    isVoter,
    validate(schemas.voterRegistration),
    asyncHandler(voterController.registerVoter)
);

// Get current user's voter profile
router.get(
    '/me',
    authenticate,
    isVoter,
    asyncHandler(voterController.getMyVoterProfile)
);

// Check if voter has voted in specific election
router.get(
    '/:voterId/elections/:electionId/voted',
    authenticate,
    asyncHandler(voterController.hasVoted)
);

// Admin routes
router.get(
    '/',
    authenticate,
    isAdmin,
    asyncHandler(voterController.getAllVoters)
);

router.get(
    '/:voterId',
    authenticate,
    isAdmin,
    asyncHandler(voterController.getVoterDetails)
);

router.post(
    '/:voterId/approve',
    authenticate,
    isAdmin,
    asyncHandler(voterController.approveVoter)
);

router.post(
    '/:voterId/reject',
    authenticate,
    isAdmin,
    validate(schemas.voterDecision),
    asyncHandler(voterController.rejectVoter)
);

module.exports = router;
