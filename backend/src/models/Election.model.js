const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String
    },
    party: {
        type: String,
        trim: true
    }
}, { _id: false });

const electionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Election title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Election description is required'],
        trim: true
    },
    electionType: {
        type: String,
        enum: ['general', 'local', 'organizational', 'poll'],
        default: 'general'
    },
    candidates: {
        type: [candidateSchema],
        validate: {
            validator: function(candidates) {
                return candidates && candidates.length > 0;
            },
            message: 'At least one candidate is required'
        }
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required'],
        validate: {
            validator: function(value) {
                return value > this.startTime;
            },
            message: 'End time must be after start time'
        }
    },
    state: {
        type: String,
        enum: ['created', 'registration', 'voting', 'ended'],
        default: 'created'
    },
    blockchainElectionId: {
        type: Number,
        unique: false,
        sparse: true
    },
    contractAddress: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eligibleVoters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voter'
    }],
    totalVotersRegistered: {
        type: Number,
        default: 0
    },
    totalVotesCast: {
        type: Number,
        default: 0
    },
    results: {
        type: Map,
        of: Number, // candidateId => voteCount
        default: new Map()
    },
    isResultsPublished: {
        type: Boolean,
        default: false
    },
    metadata: {
        visibility: {
            type: String,
            enum: ['public', 'private', 'restricted'],
            default: 'public'
        },
        requiresVerification: {
            type: Boolean,
            default: true
        },
        allowMultipleVotes: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Virtual for duration
electionSchema.virtual('duration').get(function() {
    return this.endTime - this.startTime;
});

// Virtual for current status
electionSchema.virtual('currentStatus').get(function() {
    const now = new Date();
    if (this.state === 'ended') return 'ended';
    if (now < this.startTime) return 'upcoming';
    if (now > this.endTime) return 'expired';
    if (this.state === 'voting') return 'active';
    return this.state;
});

// Method to add voter
electionSchema.methods.addEligibleVoter = function(voterId) {
    if (!this.eligibleVoters.includes(voterId)) {
        this.eligibleVoters.push(voterId);
        this.totalVotersRegistered += 1;
    }
};

// Method to check if voter is eligible
electionSchema.methods.isVoterEligible = function(voterId) {
    return this.eligibleVoters.some(
        id => id.toString() === voterId.toString()
    );
};

// Method to update vote count
electionSchema.methods.incrementVoteCount = function(candidateId) {
    this.totalVotesCast += 1;
    const currentCount = this.results.get(candidateId.toString()) || 0;
    this.results.set(candidateId.toString(), currentCount + 1);
};

// Indexes
electionSchema.index({ state: 1 });
electionSchema.index({ startTime: 1, endTime: 1 });
electionSchema.index({ blockchainElectionId: 1 });
electionSchema.index({ createdBy: 1 });

const Election = mongoose.model('Election', electionSchema);

module.exports = Election;
