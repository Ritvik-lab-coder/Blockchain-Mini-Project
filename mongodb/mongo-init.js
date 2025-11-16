// MongoDB initialization script for BlockVote
// This runs only once when MongoDB container is first created

// Switch to the application database
db = db.getSiblingDB('BCTProject');

print('🚀 Initializing BlockVote database...');

// Create admin user with hashed password
// Password: Admin@123
// This is the bcrypt hash for the password
const adminUser = {
    email: 'admin@blockvote.com',
    password: '$2b$10$C/UI8ZZMm9gqoW1iN1thqObdm4abJF3.GjiJyKnbrsrzia7M2Ylka',  // We'll generate this properly
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Check if admin already exists
const existingAdmin = db.users.findOne({ email: adminUser.email });

if (!existingAdmin) {
    // Insert admin user
    db.users.insertOne(adminUser);
    print('✅ Admin user created successfully');
    print('   Email: admin@blockvote.com');
    print('   Password: Admin@123');
    print('   ⚠️  PLEASE CHANGE THE PASSWORD AFTER FIRST LOGIN!');
} else {
    print('ℹ️  Admin user already exists, skipping creation');
}

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.voters.createIndex({ userId: 1 }, { unique: true });
db.voters.createIndex({ status: 1 });
db.voters.createIndex({ voterCommitment: 1 }, { unique: true });
db.elections.createIndex({ state: 1 });
db.elections.createIndex({ blockchainElectionId: 1 }, { sparse: true });
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ userId: 1 });
db.auditlogs.createIndex({ action: 1 });

print('✅ Database indexes created successfully');

print('🎉 BlockVote database initialization complete!');
