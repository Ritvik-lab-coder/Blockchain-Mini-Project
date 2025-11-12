const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function generateVerifier() {
    console.log('📄 Generating Solidity verifier contract...');
    
    const zkeyFinalPath = path.join(__dirname, '../../build/circuits/voting_final.zkey');
    const verifierPath = path.join(__dirname, '../../contracts/zkp/Verifier.sol');
    
    // Ensure directory exists
    const verifierDir = path.dirname(verifierPath);
    if (!fs.existsSync(verifierDir)) {
        fs.mkdirSync(verifierDir, { recursive: true });
    }
    
    // Use snarkjs CLI command directly
    const command = `snarkjs zkey export solidityverifier ${zkeyFinalPath} ${verifierPath}`;
    
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Generation failed:', error);
                reject(error);
            } else {
                console.log('✅ Verifier contract generated!');
                console.log(`   Location: ${verifierPath}`);
                console.log(stdout);
                resolve();
            }
        });
    });
}

generateVerifier()
    .then(() => console.log('✅ Done!'))
    .catch(err => console.error('❌ Error:', err));
