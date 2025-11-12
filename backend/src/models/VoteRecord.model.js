const mongoose = require('mongoose');

const voteRecordSchema = new mongoose.Schema({
    electionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
        index: true
    },
    voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voter',
        required: true
    },
    nullifier: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    candidateId: {
        type: Number,
        required: true
    },
    zkProof: {
        pi_a: [String],
        pi_b: [[String]],
        pi_c: [String],
        publicSignals: [String]
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    blockNumber: {
        type: Number
    },
    gasUsed: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
voteRecordSchema.index({ electionId: 1, timestamp: -1 });
voteRecordSchema.index({ voterId: 1, electionId: 1 });
voteRecordSchema.index({ transactionHash: 1 });

// Static method to verify vote exists
voteRecordSchema.statics.verifyVote = async function(transactionHash) {
    return await this.findOne({ transactionHash });
};

const VoteRecord = mongoose.model('VoteRecord', voteRecordSchema);

module.exports = VoteRecord;
