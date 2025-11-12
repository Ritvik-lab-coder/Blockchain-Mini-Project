const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    voterSecret: {
        type: String,
        required: true,
        select: false // Keep secret hidden by default
    },
    voterCommitment: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    isRegisteredOnChain: {
        type: Boolean,
        default: false
    },
    registrationTxHash: {
        type: String,
        sparse: true
    },
    registrationDate: {
        type: Date
    },
    eligibleElections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election'
    }],
    votedElections: [{
        electionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Election'
        },
        votedAt: {
            type: Date
        },
        nullifier: {
            type: String
        },
        txHash: {
            type: String
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    verificationDocuments: {
        idProof: String,
        addressProof: String
    }
}, {
    timestamps: true
});

// Check if voter has already voted in an election
voterSchema.methods.hasVotedIn = function (electionId) {
    return this.votedElections.some(
        vote => vote.electionId.toString() === electionId.toString()
    );
};

// Record a vote
voterSchema.methods.recordVote = function (electionId, nullifier, txHash) {
    this.votedElections.push({
        electionId,
        votedAt: new Date(),
        nullifier,
        txHash
    });
};

// Indexes for performance
voterSchema.index({ userId: 1 });
voterSchema.index({ voterCommitment: 1 });
voterSchema.index({ 'votedElections.electionId': 1 });

const Voter = mongoose.model('Voter', voterSchema);

module.exports = Voter;
