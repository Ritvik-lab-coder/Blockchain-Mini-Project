const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Dashboard statistics
router.get(
    '/dashboard/stats',
    asyncHandler(adminController.getDashboardStats)
);

// System health
router.get(
    '/system/health',
    asyncHandler(adminController.getSystemHealth)
);

// Audit logs
router.get(
    '/audit-logs',
    asyncHandler(adminController.getAuditLogs)
);

// User management
router.get(
    '/users',
    asyncHandler(adminController.getAllUsers)
);

router.post(
    '/users/:userId/deactivate',
    asyncHandler(adminController.deactivateUser)
);

router.post(
    '/users/:userId/activate',
    asyncHandler(adminController.activateUser)
);

module.exports = router;
