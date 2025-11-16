// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ElectionManager is Ownable {
    enum ElectionState {
        Created,
        Registration,
        Voting,
        Ended
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        ElectionState state;
        mapping(uint256 => uint256) votes; // candidateId => voteCount
    }

    uint256 public electionCounter;
    mapping(uint256 => Election) public elections;

    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 candidateCount
    );
    event ElectionStateChanged(
        uint256 indexed electionId,
        ElectionState newState
    );
    event VoteCounted(uint256 indexed electionId, uint256 candidateId);

    constructor() Ownable(msg.sender) {}

    // Create a new election
    function createElection(
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 candidateCount
    ) external onlyOwner returns (uint256) {
        require(startTime < endTime, "Invalid time range");
        require(candidateCount > 0, "Must have at least one candidate");

        uint256 electionId = electionCounter++;
        Election storage election = elections[electionId];

        election.id = electionId;
        election.title = title;
        election.description = description;
        election.startTime = startTime;
        election.endTime = endTime;
        election.candidateCount = candidateCount;
        election.state = ElectionState.Created;

        emit ElectionCreated(electionId, title, candidateCount);
        return electionId;
    }

    // Start registration phase
    function startRegistration(uint256 electionId) external onlyOwner {
        Election storage election = elections[electionId];
        require(election.state == ElectionState.Created, "Invalid state");
        election.state = ElectionState.Registration;
        emit ElectionStateChanged(electionId, ElectionState.Registration);
    }

    // Start voting phase - FIXED: Removed timestamp check
    function startVoting(uint256 electionId) external onlyOwner {
        Election storage election = elections[electionId];
        require(election.state == ElectionState.Registration, "Invalid state");
        // REMOVED: require(block.timestamp >= election.startTime, "Election not started yet");
        election.state = ElectionState.Voting;
        emit ElectionStateChanged(electionId, ElectionState.Voting);
    }

    // End election - FIXED: Removed timestamp check
    function endElection(uint256 electionId) external onlyOwner {
        Election storage election = elections[electionId];
        require(election.state == ElectionState.Voting, "Invalid state");
        // REMOVED: require(block.timestamp >= election.endTime, "Election not ended yet");
        election.state = ElectionState.Ended;
        emit ElectionStateChanged(electionId, ElectionState.Ended);
    }

    // Increment vote count (called by VotingSystem after ZKP verification)
    function recordVote(uint256 electionId, uint256 candidateId) external {
        Election storage election = elections[electionId];
        require(election.state == ElectionState.Voting, "Voting not active");
        require(candidateId < election.candidateCount, "Invalid candidate");

        election.votes[candidateId]++;
        emit VoteCounted(electionId, candidateId);
    }

    // Get vote count for a candidate
    function getVoteCount(
        uint256 electionId,
        uint256 candidateId
    ) external view returns (uint256) {
        return elections[electionId].votes[candidateId];
    }

    // Get election details
    function getElectionDetails(
        uint256 electionId
    )
        external
        view
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 candidateCount,
            ElectionState state
        )
    {
        Election storage election = elections[electionId];
        return (
            election.title,
            election.description,
            election.startTime,
            election.endTime,
            election.candidateCount,
            election.state
        );
    }
}
