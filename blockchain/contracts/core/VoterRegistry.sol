// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VoterRegistry is Ownable {
    // Voter commitment => registered status
    mapping(bytes32 => bool) public registeredVoters;

    // Nullifier => used status (prevents double voting)
    mapping(bytes32 => bool) public usedNullifiers;

    // Events
    event VoterRegistered(bytes32 indexed commitment);
    event NullifierUsed(bytes32 indexed nullifier);

    constructor() Ownable(msg.sender) {}

    // Register a voter with their commitment
    function registerVoter(bytes32 commitment) external onlyOwner {
        require(!registeredVoters[commitment], "Voter already registered");
        registeredVoters[commitment] = true;
        emit VoterRegistered(commitment);
    }

    // Batch register voters
    function batchRegisterVoters(
        bytes32[] calldata commitments
    ) external onlyOwner {
        for (uint i = 0; i < commitments.length; i++) {
            if (!registeredVoters[commitments[i]]) {
                registeredVoters[commitments[i]] = true;
                emit VoterRegistered(commitments[i]);
            }
        }
    }

    // Check if voter is registered
    function isVoterRegistered(
        bytes32 commitment
    ) external view returns (bool) {
        return registeredVoters[commitment];
    }

    // Mark nullifier as used
    function useNullifier(bytes32 nullifier) external {
        require(!usedNullifiers[nullifier], "Nullifier already used");
        usedNullifiers[nullifier] = true;
        emit NullifierUsed(nullifier);
    }

    // Check if nullifier has been used
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
}
