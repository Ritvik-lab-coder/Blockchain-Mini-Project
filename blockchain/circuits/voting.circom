pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Main voting circuit
// Proves: 1) Voter is eligible, 2) Vote is valid, 3) No double voting
template VotingCircuit() {
    // Private inputs (witness)
    signal input voterSecret;           // Voter's secret key
    signal input candidateId;           // Vote choice (0, 1, 2, ...)
    signal input electionId;            // Which election
    
    // Public inputs - THESE BECOME PUBLIC SIGNALS IN ORDER
    signal input voterCommitment;       // Public commitment = hash(voterSecret)
    signal input nullifier;             // Prevents double voting = hash(voterSecret, electionId)
    signal input maxCandidates;         // Maximum number of candidates
    
    // Component 1: Verify voter commitment
    // Proves voter knows the secret without revealing it
    component commitmentHasher = Poseidon(1);
    commitmentHasher.inputs[0] <== voterSecret;
    commitmentHasher.out === voterCommitment;
    
    // Component 2: Generate and verify nullifier
    // Ensures voter can't vote twice in same election
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== voterSecret;
    nullifierHasher.inputs[1] <== electionId;
    nullifierHasher.out === nullifier;
    
    // Component 3: Verify vote is within valid range
    component validCandidate = LessThan(32);
    validCandidate.in[0] <== candidateId;
    validCandidate.in[1] <== maxCandidates;
    validCandidate.out === 1;
}

// IMPORTANT: The order here defines the public signals order
// Public signals will be: [voterCommitment, nullifier, maxCandidates]
component main {public [voterCommitment, nullifier, maxCandidates]} = VotingCircuit();
