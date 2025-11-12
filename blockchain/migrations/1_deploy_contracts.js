const Verifier = artifacts.require("Groth16Verifier"); // Changed from "Verifier"
const VoterRegistry = artifacts.require("VoterRegistry");
const ElectionManager = artifacts.require("ElectionManager");
const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function (deployer, network, accounts) {
    console.log("🚀 Deploying contracts to", network);
    console.log("📍 Deployer address:", accounts[0]);

    // Deploy Verifier (ZKP verification contract)
    console.log("\n1️⃣  Deploying Verifier...");
    await deployer.deploy(Verifier);
    const verifier = await Verifier.deployed();
    console.log("✅ Verifier deployed at:", verifier.address);

    // Deploy VoterRegistry
    console.log("\n2️⃣  Deploying VoterRegistry...");
    await deployer.deploy(VoterRegistry);
    const voterRegistry = await VoterRegistry.deployed();
    console.log("✅ VoterRegistry deployed at:", voterRegistry.address);

    // Deploy ElectionManager
    console.log("\n3️⃣  Deploying ElectionManager...");
    await deployer.deploy(ElectionManager);
    const electionManager = await ElectionManager.deployed();
    console.log("✅ ElectionManager deployed at:", electionManager.address);

    // Deploy VotingSystem
    console.log("\n4️⃣  Deploying VotingSystem...");
    await deployer.deploy(
        VotingSystem,
        verifier.address,
        voterRegistry.address,
        electionManager.address
    );
    const votingSystem = await VotingSystem.deployed();
    console.log("✅ VotingSystem deployed at:", votingSystem.address);

    // Save deployment addresses
    console.log("\n📝 Deployment Summary:");
    console.log("========================");
    console.log("Verifier:        ", verifier.address);
    console.log("VoterRegistry:   ", voterRegistry.address);
    console.log("ElectionManager: ", electionManager.address);
    console.log("VotingSystem:    ", votingSystem.address);
    console.log("========================\n");
};
