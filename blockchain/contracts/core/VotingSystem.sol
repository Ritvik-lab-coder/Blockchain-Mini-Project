// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../zkp/Verifier.sol";
import "./VoterRegistry.sol";
import "./ElectionManager.sol";

contract VotingSystem {
    Groth16Verifier public verifier;
    VoterRegistry public voterRegistry;
    ElectionManager public electionManager;

    event VoteCast(
        uint256 indexed electionId,
        bytes32 indexed nullifier,
        uint256 timestamp
    );

    constructor(
        address _verifier,
        address _voterRegistry,
        address _electionManager
    ) {
        verifier = Groth16Verifier(_verifier);
        voterRegistry = VoterRegistry(_voterRegistry);
        electionManager = ElectionManager(_electionManager);
    }

    // Cast a vote with ZKP
    function castVote(
        uint256 electionId,
        uint256 candidateId,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory publicSignals // CHANGED from [3] to [4]
        // [voterCommitment, nullifier, maxCandidates, valid]
    ) external {
        bytes32 voterCommitment = bytes32(publicSignals[0]);
        bytes32 nullifier = bytes32(publicSignals[1]);
        // publicSignals[2] is maxCandidates
        // publicSignals[3] is the valid output (always 1)

        // 1. Check voter is registered
        require(
            voterRegistry.isVoterRegistered(voterCommitment),
            "Voter not registered"
        );

        // 2. Check nullifier hasn't been used (prevent double voting)
        require(!voterRegistry.isNullifierUsed(nullifier), "Vote already cast");

        // 3. Verify ZKP proof
        require(verifier.verifyProof(a, b, c, publicSignals), "Invalid proof");

        // 4. Mark nullifier as used
        voterRegistry.useNullifier(nullifier);

        // 5. Record the vote
        electionManager.recordVote(electionId, candidateId);

        emit VoteCast(electionId, nullifier, block.timestamp);
    }

    // Get results for an election
    function getResults(
        uint256 electionId,
        uint256 candidateCount
    ) external view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) {
            results[i] = electionManager.getVoteCount(electionId, i);
        }
        return results;
    }
}
