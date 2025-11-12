const express = require('express');
const router = express.Router();
const electionController = require('../controllers/election.controller');
const { authenticate, isAdmin, optionalAuth } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Public routes (with optional auth)
router.get(
    '/',
    optionalAuth,
    asyncHandler(electionController.getAllElections)
);

router.get(
    '/:electionId',
    optionalAuth,
    asyncHandler(electionController.getElectionById)
);

router.get(
    '/:electionId/results',
    optionalAuth,
    asyncHandler(electionController.getResults)
);

router.get(
    '/:electionId/statistics',
    optionalAuth,
    asyncHandler(electionController.getStatistics)
);

// Admin routes
router.post(
    '/',
    authenticate,
    isAdmin,
    validate(schemas.createElection),
    asyncHandler(electionController.createElection)
);

router.post(
    '/:electionId/registration/start',
    authenticate,
    isAdmin,
    asyncHandler(electionController.startRegistration)
);

router.post(
    '/:electionId/voting/start',
    authenticate,
    isAdmin,
    asyncHandler(electionController.startVoting)
);

router.post(
    '/:electionId/end',
    authenticate,
    isAdmin,
    asyncHandler(electionController.endElection)
);

router.post(
    '/:electionId/voters/:voterId',
    authenticate,
    isAdmin,
    asyncHandler(electionController.addEligibleVoter)
);

module.exports = router;
