const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class ZKProofService {
    constructor() {
        this.circuitWasmPath = path.resolve(process.env.CIRCUIT_WASM_PATH);
        this.provingKeyPath = path.resolve(process.env.PROVING_KEY_PATH);
        this.verificationKeyPath = path.resolve(process.env.VERIFICATION_KEY_PATH);
        
        this.initialized = false;
    }

    // Initialize and verify ZKP files exist
    async initialize() {
        try {
            // Check if files exist
            if (!fs.existsSync(this.circuitWasmPath)) {
                throw new Error(`Circuit WASM not found: ${this.circuitWasmPath}`);
            }
            if (!fs.existsSync(this.provingKeyPath)) {
                throw new Error(`Proving key not found: ${this.provingKeyPath}`);
            }
            if (!fs.existsSync(this.verificationKeyPath)) {
                throw new Error(`Verification key not found: ${this.verificationKeyPath}`);
            }

            this.initialized = true;
            logger.info('✅ ZKP service initialized');
            logger.info(`   Circuit: ${this.circuitWasmPath}`);
            logger.info(`   Proving key: ${this.provingKeyPath}`);
        } catch (error) {
            logger.error('❌ ZKP service initialization failed:', error);
            throw error;
        }
    }

    // Generate voting proof
    async generateVotingProof({ voterSecret, candidateId, electionId, maxCandidates }) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            logger.info('🔐 Generating zero-knowledge proof...');
            logger.info(`   Voter secret: ${voterSecret.toString().substring(0, 10)}...`);
            logger.info(`   Candidate ID: ${candidateId}`);
            logger.info(`   Election ID: ${electionId}`);
            logger.info(`   Max candidates: ${maxCandidates}`);

            // Calculate commitment and nullifier using Poseidon
            const { buildPoseidon } = require('circomlibjs');
            const poseidon = await buildPoseidon();

            const commitment = poseidon.F.toString(
                poseidon([BigInt(voterSecret)])
            );

            const nullifier = poseidon.F.toString(
                poseidon([BigInt(voterSecret), BigInt(electionId)])
            );

            logger.info(`   Calculated commitment: ${commitment}`);
            logger.info(`   Calculated nullifier: ${nullifier}`);

            // Prepare circuit inputs
            const input = {
                voterSecret: voterSecret.toString(),
                candidateId: candidateId,
                electionId: electionId,
                voterCommitment: commitment,
                nullifier: nullifier,
                maxCandidates: maxCandidates
            };

            logger.info('   Generating proof with snarkjs...');

            // Generate proof using snarkjs
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                this.circuitWasmPath,
                this.provingKeyPath
            );

            logger.info('✅ Proof generated successfully');
            logger.info(`   Public signals count: ${publicSignals.length}`);
            logger.info(`   Public signals:`, publicSignals);

            return {
                proof,
                publicSignals,
                nullifier,
                commitment
            };
        } catch (error) {
            logger.error('❌ Proof generation failed:', error);
            throw error;
        }
    }

    // Verify proof
    async verifyProof(publicSignals, proof) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            logger.info('🔍 Verifying zero-knowledge proof...');

            // Load verification key
            const vKey = JSON.parse(fs.readFileSync(this.verificationKeyPath, 'utf8'));

            // Verify proof
            const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

            logger.info(`   Verification result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

            return isValid;
        } catch (error) {
            logger.error('❌ Proof verification failed:', error);
            throw error;
        }
    }

    // Export verification key
    async getVerificationKey() {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const vKey = JSON.parse(fs.readFileSync(this.verificationKeyPath, 'utf8'));
            return vKey;
        } catch (error) {
            logger.error('Get verification key error:', error);
            throw error;
        }
    }

    // Validate proof structure
    validateProofStructure(proof) {
        return (
            proof &&
            proof.pi_a &&
            proof.pi_b &&
            proof.pi_c &&
            Array.isArray(proof.pi_a) &&
            Array.isArray(proof.pi_b) &&
            Array.isArray(proof.pi_c) &&
            proof.pi_a.length === 3 &&
            proof.pi_b.length === 3 &&
            proof.pi_c.length === 3
        );
    }
}

module.exports = new ZKProofService();
