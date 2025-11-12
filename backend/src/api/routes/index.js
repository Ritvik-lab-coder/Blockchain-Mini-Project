const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const voterRoutes = require('./voter.routes');
const electionRoutes = require('./election.routes');
const votingRoutes = require('./voting.routes');
const zkproofRoutes = require('./zkproof.routes');
const adminRoutes = require('./admin.routes');

// API information
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Blockchain Voting API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            voters: '/api/voters',
            elections: '/api/elections',
            voting: '/api/voting',
            zkproof: '/api/zkproof',
            admin: '/api/admin'
        },
        documentation: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                profile: 'GET /api/auth/profile',
                refreshToken: 'POST /api/auth/refresh-token'
            },
            voters: {
                register: 'POST /api/voters/register',
                getProfile: 'GET /api/voters/me',
                approve: 'POST /api/voters/:voterId/approve (Admin)',
                reject: 'POST /api/voters/:voterId/reject (Admin)'
            },
            elections: {
                getAll: 'GET /api/elections',
                getById: 'GET /api/elections/:electionId',
                create: 'POST /api/elections (Admin)',
                startRegistration: 'POST /api/elections/:electionId/registration/start (Admin)',
                startVoting: 'POST /api/elections/:electionId/voting/start (Admin)',
                endElection: 'POST /api/elections/:electionId/end (Admin)',
                results: 'GET /api/elections/:electionId/results'
            },
            voting: {
                cast: 'POST /api/voting/cast',
                verify: 'GET /api/voting/verify/:transactionHash',
                history: 'GET /api/voting/history',
                canVote: 'GET /api/voting/can-vote/:electionId'
            },
            zkproof: {
                generate: 'POST /api/zkproof/generate',
                verify: 'POST /api/zkproof/verify',
                verificationKey: 'GET /api/zkproof/verification-key'
            },
            admin: {
                dashboard: 'GET /api/admin/dashboard/stats',
                systemHealth: 'GET /api/admin/system/health',
                auditLogs: 'GET /api/admin/audit-logs',
                users: 'GET /api/admin/users'
            }
        }
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/voters', voterRoutes);
router.use('/elections', electionRoutes);
router.use('/voting', votingRoutes);
router.use('/zkproof', zkproofRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
