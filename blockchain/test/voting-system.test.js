const { expect } = require('chai');
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

const Verifier = artifacts.require("Groth16Verifier");
const VoterRegistry = artifacts.require("VoterRegistry");
const ElectionManager = artifacts.require("ElectionManager");
const VotingSystem = artifacts.require("VotingSystem");

contract("VotingSystem", (accounts) => {
    let verifier, voterRegistry, electionManager, votingSystem;
    let electionId;

    const admin = accounts[0];
    const voterSecret = 12345n;
    const candidateId = 1;
    const maxCandidates = 3;

    // Store the commitment and nullifier for consistency
    let voterCommitment;
    let nullifier;

    before(async () => {
        verifier = await Verifier.deployed();
        voterRegistry = await VoterRegistry.deployed();
        electionManager = await ElectionManager.deployed();
        votingSystem = await VotingSystem.deployed();

        console.log("\n📋 Contract Addresses:");
        console.log("Verifier:        ", verifier.address);
        console.log("VoterRegistry:   ", voterRegistry.address);
        console.log("ElectionManager: ", electionManager.address);
        console.log("VotingSystem:    ", votingSystem.address);
    });

    describe("Election Creation", () => {
        it("should create an election", async () => {
            const startTime = Math.floor(Date.now() / 1000);
            const endTime = startTime + 86400; // 24 hours

            const tx = await electionManager.createElection(
                "Test Election",
                "A test election",
                startTime,
                endTime,
                maxCandidates,
                { from: admin }
            );

            electionId = tx.logs[0].args.electionId.toNumber();
            console.log("✅ Election created with ID:", electionId);

            expect(electionId).to.equal(0);
        });

        it("should start registration phase", async () => {
            await electionManager.startRegistration(electionId, { from: admin });
            console.log("✅ Registration phase started");
        });
    });

    describe("Voter Registration", () => {
        it("should register a voter", async () => {
            // Calculate commitment: hash(voterSecret)
            const poseidon = await buildPoseidon();
            const commitmentBigInt = poseidon.F.toString(poseidon([voterSecret]));

            // Store for later use
            voterCommitment = commitmentBigInt;

            const commitmentBytes = web3.utils.padLeft(
                web3.utils.toHex(commitmentBigInt),
                64
            );

            console.log("📝 Registering voter with commitment:");
            console.log("   BigInt:", commitmentBigInt);
            console.log("   Hex:", commitmentBytes);

            await voterRegistry.registerVoter(commitmentBytes, { from: admin });

            const isRegistered = await voterRegistry.isVoterRegistered(commitmentBytes);
            expect(isRegistered).to.be.true;

            console.log("✅ Voter registered successfully");
        });
    });

    describe("Voting", () => {
        it("should cast a vote with valid ZKP", async () => {
            // Start voting phase
            await electionManager.startVoting(electionId, { from: admin });
            console.log("✅ Voting phase started");

            // Generate ZKP proof
            console.log("🔐 Generating zero-knowledge proof...");
            const { proof, publicSignals } = await generateProof(
                voterSecret,
                candidateId,
                electionId,
                maxCandidates
            );

            console.log("✅ Proof generated");
            console.log("📊 Public signals:", publicSignals);

            // Debug: Check the commitment matches
            console.log("\n🔍 Debug Info:");
            console.log("   Expected commitment:", voterCommitment);
            console.log("   Proof commitment:   ", publicSignals[0]);
            console.log("   Match:", voterCommitment === publicSignals[0]);

            // Cast vote
            const tx = await votingSystem.castVote(
                electionId,
                candidateId,
                proof.pi_a.slice(0, 2),
                [proof.pi_b[0].slice(0, 2).reverse(), proof.pi_b[1].slice(0, 2).reverse()],
                proof.pi_c.slice(0, 2),
                publicSignals // Should be 3 elements: [voterCommitment, nullifier, maxCandidates]
            );

            console.log("✅ Vote cast successfully!");
            console.log("   Gas used:", tx.receipt.gasUsed);
            console.log("   Transaction hash:", tx.tx);

            // Verify vote was counted
            const voteCount = await electionManager.getVoteCount(electionId, candidateId);
            expect(voteCount.toNumber()).to.equal(1);

            console.log("✅ Vote counted for candidate", candidateId);
        });

        it("should prevent double voting", async () => {
            try {
                const { proof, publicSignals } = await generateProof(
                    voterSecret,
                    candidateId,
                    electionId,
                    maxCandidates
                );

                await votingSystem.castVote(
                    electionId,
                    candidateId,
                    proof.pi_a.slice(0, 2),
                    [proof.pi_b[0].slice(0, 2).reverse(), proof.pi_b[1].slice(0, 2).reverse()],
                    proof.pi_c.slice(0, 2),
                    publicSignals
                );

                expect.fail("Should have thrown error");
            } catch (error) {
                expect(error.message).to.include("Vote already cast");
                console.log("✅ Double voting prevented");
            }
        });
    });

    describe("Results", () => {
        it("should retrieve election results", async () => {
            const results = await votingSystem.getResults(electionId, maxCandidates);

            console.log("\n📊 Election Results:");
            for (let i = 0; i < results.length; i++) {
                console.log(`   Candidate ${i}: ${results[i].toNumber()} votes`);
            }

            expect(results[candidateId].toNumber()).to.equal(1);
            console.log("✅ Results verified successfully!");
        });
    });
});

// Helper function to generate ZKP proof
async function generateProof(voterSecret, candidateId, electionId, maxCandidates) {
    const poseidon = await buildPoseidon();

    // Calculate commitment and nullifier
    const commitment = poseidon.F.toString(poseidon([voterSecret]));
    const nullifier = poseidon.F.toString(poseidon([voterSecret, electionId]));

    console.log("\n🔐 ZKP Input Calculation:");
    console.log("   voterSecret:", voterSecret.toString());
    console.log("   candidateId:", candidateId);
    console.log("   electionId:", electionId);
    console.log("   Calculated commitment:", commitment);
    console.log("   Calculated nullifier:", nullifier);
    console.log("   maxCandidates:", maxCandidates);

    // Prepare circuit inputs
    const input = {
        voterSecret: voterSecret.toString(),
        candidateId: candidateId,
        electionId: electionId,
        voterCommitment: commitment,
        nullifier: nullifier,
        maxCandidates: maxCandidates
    };

    // Generate proof
    const wasmPath = path.join(__dirname, '../build/circuits/voting_js/voting.wasm');
    const zkeyPath = path.join(__dirname, '../build/circuits/voting_final.zkey');

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
    );

    console.log("\n📤 Generated Public Signals:");
    console.log("   Count:", publicSignals.length);
    console.log("   Values:", publicSignals);

    // Circuit produces 3 public signals: [voterCommitment, nullifier, maxCandidates]
    if (publicSignals.length !== 3) {
        throw new Error(`Expected 3 public signals, got ${publicSignals.length}`);
    }

    return { proof, publicSignals };
}

// Helper to build Poseidon hash function
async function buildPoseidon() {
    const buildPoseidonModule = require('circomlibjs').buildPoseidon;
    return await buildPoseidonModule();
}
