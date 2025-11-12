const User = require('./User.model');
const Voter = require('./Voter.model');
const Election = require('./Election.model');
const AuditLog = require('./AuditLog.model');
const VoteRecord = require('./VoteRecord.model');

module.exports = {
    User,
    Voter,
    Election,
    AuditLog,
    VoteRecord
};
