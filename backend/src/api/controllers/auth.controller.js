const authService = require('../../services/auth.service');
const logger = require('../../utils/logger');

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const { email, password, firstName, lastName, role } = req.body;

            const result = await authService.register({
                email,
                password,
                firstName,
                lastName,
                role
            });

            res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            logger.error('Register error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip;

            const result = await authService.login(email, password, ipAddress);

            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Refresh access token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Refresh token is required'
                });
            }

            const result = await authService.refreshAccessToken(refreshToken);

            res.status(200).json({
                status: 'success',
                message: 'Token refreshed successfully',
                data: result
            });
        } catch (error) {
            logger.error('Refresh token error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Logout user
    async logout(req, res) {
        try {
            const userId = req.user._id;
            const ipAddress = req.ip;

            await authService.logout(userId, ipAddress);

            res.status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Logout failed'
            });
        }
    }

    // Get current user profile
    async getProfile(req, res) {
        try {
            res.status(200).json({
                status: 'success',
                data: {
                    user: req.user.getPublicProfile()
                }
            });
        } catch (error) {
            logger.error('Get profile error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get profile'
            });
        }
    }

    // Verify token (for frontend to check if token is valid)
    async verifyToken(req, res) {
        try {
            res.status(200).json({
                status: 'success',
                message: 'Token is valid',
                data: {
                    user: req.user.getPublicProfile()
                }
            });
        } catch (error) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }
    }
}

module.exports = new AuthController();
