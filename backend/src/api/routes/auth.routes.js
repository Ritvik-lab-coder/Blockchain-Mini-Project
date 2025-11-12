const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Public routes
router.post(
    '/register',
    authLimiter,
    validate(schemas.register),
    asyncHandler(authController.register)
);

router.post(
    '/login',
    authLimiter,
    validate(schemas.login),
    asyncHandler(authController.login)
);

router.post(
    '/refresh-token',
    asyncHandler(authController.refreshToken)
);

// Protected routes
router.post(
    '/logout',
    authenticate,
    asyncHandler(authController.logout)
);

router.get(
    '/profile',
    authenticate,
    asyncHandler(authController.getProfile)
);

router.get(
    '/verify',
    authenticate,
    asyncHandler(authController.verifyToken)
);

module.exports = router;
