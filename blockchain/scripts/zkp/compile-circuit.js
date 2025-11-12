const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function compileCircuit() {
    console.log('🔧 Compiling Circom circuit...');

    const circuitPath = path.join(__dirname, '../../circuits/voting.circom');
    const buildPath = path.join(__dirname, '../../build/circuits');

    // Create build directory
    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true });
    }

    // Compile circuit
    const compileCmd = `circom ${circuitPath} --r1cs --wasm --sym --output ${buildPath}`;

    return new Promise((resolve, reject) => {
        exec(compileCmd, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Compilation error:', error);
                reject(error);
            } else {
                console.log('✅ Circuit compiled successfully!');
                console.log(stdout);
                resolve();
            }
        });
    });
}

compileCircuit()
    .then(() => console.log('✅ Done!'))
    .catch(err => console.error('❌ Error:', err));
