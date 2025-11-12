const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

async function setupCeremony() {
    console.log('🔐 Starting ZKP trusted setup ceremony...');

    const buildDir = path.join(__dirname, '../../build/circuits');
    const r1csPath = path.join(buildDir, 'voting.r1cs');
    const ptauPath = path.join(__dirname, '../../circuits/pot12_final.ptau');
    const zkeyPath = path.join(buildDir, 'voting_0000.zkey');
    const zkeyFinalPath = path.join(buildDir, 'voting_final.zkey');
    const vkeyPath = path.join(buildDir, 'verification_key.json');

    try {
        // Phase 1: Setup
        console.log('📝 Phase 1: Initial setup...');
        await snarkjs.zKey.newZKey(r1csPath, ptauPath, zkeyPath);

        // Phase 2: Contribution (add randomness)
        console.log('📝 Phase 2: Contributing randomness...');
        await snarkjs.zKey.contribute(
            zkeyPath,
            zkeyFinalPath,
            'Contribution',
            Buffer.from('random entropy ' + Date.now())
        );

        // Export verification key
        console.log('📝 Exporting verification key...');
        const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFinalPath);
        fs.writeFileSync(vkeyPath, JSON.stringify(vKey, null, 2));

        console.log('✅ Trusted setup completed!');
        console.log(`   - Proving key: ${zkeyFinalPath}`);
        console.log(`   - Verification key: ${vkeyPath}`);

    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    }
}

setupCeremony()
    .then(() => console.log('✅ Done!'))
    .catch(err => console.error('❌ Error:', err));
