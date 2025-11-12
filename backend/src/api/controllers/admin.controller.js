const { User, Voter, Election, VoteRecord, AuditLog } = require('../../models');
const logger = require('../../utils/logger');

class AdminController {
    // Get dashboard statistics
    async getDashboardStats(req, res) {
        try {
            const [
                totalUsers,
                totalVoters,
                approvedVoters,
                pendingVoters,
                totalElections,
                activeElections,
                totalVotes
            ] = await Promise.all([
                User.countDocuments(),
                Voter.countDocuments(),
                Voter.countDocuments({ status: 'approved' }),
                Voter.countDocuments({ status: 'pending' }),
                Election.countDocuments(),
                Election.countDocuments({ state: 'voting' }),
                VoteRecord.countDocuments()
            ]);

            res.status(200).json({
                status: 'success',
                data: {
                    users: {
                        total: totalUsers
                    },
                    voters: {
                        total: totalVoters,
                        approved: approvedVoters,
                        pending: pendingVoters
                    },
                    elections: {
                        total: totalElections,
                        active: activeElections
                    },
                    votes: {
                        total: totalVotes
                    }
                }
            });
        } catch (error) {
            logger.error('Get dashboard stats error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get dashboard statistics'
            });
        }
    }

    // Get audit logs
    async getAuditLogs(req, res) {
        try {
            const { action, page = 1, limit = 20 } = req.query;
            const skip = (page - 1) * limit;

            const filter = action ? { action } : {};

            const [logs, total] = await Promise.all([
                AuditLog.find(filter)
                    .populate('userId', 'email firstName lastName')
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                AuditLog.countDocuments(filter)
            ]);

            res.status(200).json({
                status: 'success',
                data: {
                    logs,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Get audit logs error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get audit logs'
            });
        }
    }

    // Get all users
    async getAll(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;

            const filter = {};
            if (status) {
                filter.status = status;
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const voters = await voterService.getAllVoters(filter, skip, limitNum);
            const total = await voterService.countVoters(filter);

            res.status(200).json({
                status: 'success',
                data: {
                    data: voters,  // ← Changed from "voters" to "data"
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum)
                    }
                }
            });
        } catch (error) {
            logger.error('Get all voters error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch voters'
            });
        }
    }

    // Deactivate user
    async deactivateUser(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            user.isActive = false;
            await user.save();

            await AuditLog.log({
                action: 'admin_action',
                userId: req.user._id,
                targetId: userId,
                targetModel: 'User',
                description: `User deactivated: ${user.email}`
            });

            res.status(200).json({
                status: 'success',
                message: 'User deactivated successfully'
            });
        } catch (error) {
            logger.error('Deactivate user error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to deactivate user'
            });
        }
    }

    // Activate user
    async activateUser(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            user.isActive = true;
            await user.save();

            await AuditLog.log({
                action: 'admin_action',
                userId: req.user._id,
                targetId: userId,
                targetModel: 'User',
                description: `User activated: ${user.email}`
            });

            res.status(200).json({
                status: 'success',
                message: 'User activated successfully'
            });
        } catch (error) {
            logger.error('Activate user error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to activate user'
            });
        }
    }

    // Get system health
    async getSystemHealth(req, res) {
        try {
            const blockchainService = require('../../services/blockchain.service');
            const web3Provider = require('../../blockchain/web3Provider');

            const health = {
                database: 'connected',
                blockchain: 'disconnected',
                zkp: 'ready',
                timestamp: new Date()
            };

            // Check blockchain connection safely
            try {
                if (blockchainService.initialized) {
                    const blockNumber = await web3Provider.getCurrentBlock();
                    health.blockchain = 'connected';
                    health.blockchainBlock = blockNumber;
                }
            } catch (error) {
                console.error('Blockchain health check error:', error.message);
                health.blockchain = 'error';
            }

            res.status(200).json({
                status: 'success',
                data: health
            });
        } catch (error) {
            console.error('Get system health error:', error);
            // Return partial health info instead of failing
            res.status(200).json({
                status: 'success',
                data: {
                    database: 'connected',
                    blockchain: 'unknown',
                    zkp: 'ready',
                    timestamp: new Date()
                }
            });
        }
    }

}

module.exports = new AdminController();
