const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'user_register',
            'user_login',
            'user_logout',
            'voter_register',
            'voter_approve',
            'voter_reject',
            'election_create',
            'election_start',
            'election_end',
            'vote_cast',
            'vote_verify',
            'results_publish',
            'admin_action',
            'security_event'
        ]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetModel'
    },
    targetModel: {
        type: String,
        enum: ['User', 'Voter', 'Election', 'AuditLog']
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'pending'],
        default: 'success'
    },
    errorMessage: {
        type: String
    },
    blockchainTxHash: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Static method to create log entry
auditLogSchema.statics.log = async function(data) {
    try {
        const logEntry = new this(data);
        await logEntry.save();
        return logEntry;
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, targetModel: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
