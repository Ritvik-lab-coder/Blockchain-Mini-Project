const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');
const logger = require('../utils/logger');

class AuthService {
    // Generate JWT access token
    generateAccessToken(user) {
        return jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );
    }

    // Generate JWT refresh token
    generateRefreshToken(user) {
        return jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
        );
    }

    // Register new user
    async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create new user
            const user = new User(userData);
            await user.save();

            // Log the registration
            await AuditLog.log({
                action: 'user_register',
                userId: user._id,
                description: `User registered: ${user.email}`,
                metadata: { email: user.email }
            });

            logger.info(`New user registered: ${user.email}`);

            // Generate tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            // Save refresh token
            user.refreshToken = refreshToken;
            await user.save();

            return {
                user: user.getPublicProfile(),
                accessToken,
                refreshToken
            };
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password, ipAddress) {
        try {
            // Find user with password field
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                await AuditLog.log({
                    action: 'user_login',
                    description: `Failed login attempt for ${email}`,
                    status: 'failure',
                    ipAddress,
                    metadata: { email }
                });
                throw new Error('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                await AuditLog.log({
                    action: 'user_login',
                    userId: user._id,
                    description: `Failed login attempt - invalid password`,
                    status: 'failure',
                    ipAddress
                });
                throw new Error('Invalid email or password');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            // Save refresh token
            user.refreshToken = refreshToken;
            await user.save();

            // Log successful login
            await AuditLog.log({
                action: 'user_login',
                userId: user._id,
                description: `User logged in: ${user.email}`,
                ipAddress,
                metadata: { email: user.email }
            });

            logger.info(`User logged in: ${user.email}`);

            return {
                user: user.getPublicProfile(),
                accessToken,
                refreshToken
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Find user
            const user = await User.findById(decoded.id).select('+refreshToken');
            if (!user || user.refreshToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Generate new access token
            const newAccessToken = this.generateAccessToken(user);

            return { accessToken: newAccessToken };
        } catch (error) {
            logger.error('Token refresh error:', error);
            throw new Error('Invalid or expired refresh token');
        }
    }

    // Logout
    async logout(userId, ipAddress) {
        try {
            const user = await User.findById(userId);
            if (user) {
                user.refreshToken = null;
                await user.save();

                await AuditLog.log({
                    action: 'user_logout',
                    userId: user._id,
                    description: `User logged out: ${user.email}`,
                    ipAddress
                });

                logger.info(`User logged out: ${user.email}`);
            }
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = new AuthService();
