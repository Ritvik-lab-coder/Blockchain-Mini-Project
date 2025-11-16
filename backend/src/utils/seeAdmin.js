const bcryptjs = require('bcryptjs');
const User = require('../models/User.model');
const logger = require('./logger');

async function createDefaultAdmin() {
    try {
        // Check if any admin exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            logger.info('ℹ️  Admin user already exists, skipping creation');
            return;
        }

        // Get admin credentials from environment variables
        const email = process.env.ADMIN_EMAIL || 'admin@blockvote.com';
        const password = process.env.ADMIN_PASSWORD || 'Admin@123';
        const firstName = process.env.ADMIN_FIRST_NAME || 'System';
        const lastName = process.env.ADMIN_LAST_NAME || 'Administrator';

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create admin user
        const admin = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'admin',
            isActive: true,
            isEmailVerified: true
        });

        await admin.save();

        logger.info('✅ Default admin user created successfully');
        logger.info(`   Email: ${email}`);
        logger.info(`   Password: ${password}`);
        logger.info('   ⚠️  PLEASE CHANGE THE PASSWORD AFTER FIRST LOGIN!');
    } catch (error) {
        logger.error('❌ Error creating default admin:', error);
        // Don't throw error, let server continue
    }
}

module.exports = {
    createDefaultAdmin
};
