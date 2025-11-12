require('dotenv').config();
const connectDatabase = require('../database/connection');
const { User, Voter, Election, AuditLog, VoteRecord } = require('./index');

async function testModels() {
    try {
        await connectDatabase();
        
        console.log('✅ All models loaded successfully:');
        console.log('  - User:', User.modelName);
        console.log('  - Voter:', Voter.modelName);
        console.log('  - Election:', Election.modelName);
        console.log('  - AuditLog:', AuditLog.modelName);
        console.log('  - VoteRecord:', VoteRecord.modelName);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testModels();
