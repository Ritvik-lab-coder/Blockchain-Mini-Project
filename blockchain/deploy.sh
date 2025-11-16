#!/bin/sh

set -e

echo "🚀 Starting contract deployment process..."

# Wait for Ganache to be ready
echo "⏳ Waiting for Ganache to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until curl -s http://ganache:8545 > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Ganache failed to start after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Ganache is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✅ Ganache is ready!"

# Check if contracts are already deployed
if [ -f "/shared/contracts.json" ]; then
  echo "📋 Checking if contracts are already deployed..."
  
  if grep -q "ElectionManager" /shared/contracts.json && \
     grep -q "VotingSystem" /shared/contracts.json && \
     grep -q "Verifier" /shared/contracts.json && \
     ! grep -q "PLACEHOLDER" /shared/contracts.json; then
    
    echo "✅ Contracts already deployed. Skipping deployment."
    cat /shared/contracts.json
    exit 0
  fi
fi

# Deploy contracts
echo "📝 Deploying contracts to Ganache..."
npx truffle migrate --network docker --reset

# Wait for deployment to finalize
sleep 3

# Check if build directory exists
if [ ! -d "./build/contracts" ]; then
  echo "❌ Build directory not found after deployment!"
  exit 1
fi

echo "📋 Extracting contract addresses..."

# Function to extract address
extract_address() {
  CONTRACT_NAME=$1
  CONTRACT_FILE="./build/contracts/${CONTRACT_NAME}.json"
  
  if [ ! -f "$CONTRACT_FILE" ]; then
    echo "❌ File not found: $CONTRACT_FILE"
    return 1
  fi
  
  node -e "
    try {
      const fs = require('fs');
      const artifact = JSON.parse(fs.readFileSync('$CONTRACT_FILE', 'utf8'));
      const networks = artifact.networks;
      const networkIds = Object.keys(networks);
      
      if (networkIds.length === 0) {
        console.error('ERROR: No networks found');
        process.exit(1);
      }
      
      const address = networks[networkIds[0]].address;
      
      if (!address) {
        console.error('ERROR: No address found');
        process.exit(1);
      }
      
      console.log(address);
    } catch(e) {
      console.error('ERROR: ' + e.message);
      process.exit(1);
    }
  " 2>&1
}

# Extract all contract addresses
VERIFIER_ADDRESS=$(extract_address "Groth16Verifier")
VOTER_REGISTRY_ADDRESS=$(extract_address "VoterRegistry")
ELECTION_MANAGER_ADDRESS=$(extract_address "ElectionManager")
VOTING_SYSTEM_ADDRESS=$(extract_address "VotingSystem")

# Validate addresses
if [ -z "$VERIFIER_ADDRESS" ] || [ -z "$ELECTION_MANAGER_ADDRESS" ] || [ -z "$VOTING_SYSTEM_ADDRESS" ]; then
  echo "❌ One or more addresses are empty!"
  exit 1
fi

echo "✅ Successfully extracted addresses:"
echo "   Verifier: $VERIFIER_ADDRESS"
echo "   VoterRegistry: $VOTER_REGISTRY_ADDRESS"
echo "   ElectionManager: $ELECTION_MANAGER_ADDRESS"
echo "   VotingSystem: $VOTING_SYSTEM_ADDRESS"

# Create /shared directory
mkdir -p /shared

# Save to shared volume
echo "💾 Saving to /shared/contracts.json..."

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > /shared/contracts.json <<EOF
{
  "Verifier": "$VERIFIER_ADDRESS",
  "VoterRegistry": "$VOTER_REGISTRY_ADDRESS",
  "ElectionManager": "$ELECTION_MANAGER_ADDRESS",
  "VotingSystem": "$VOTING_SYSTEM_ADDRESS",
  "networkId": "5777",
  "chainId": "1337",
  "deployedAt": "$TIMESTAMP"
}
EOF

# Verify file was created
if [ ! -f "/shared/contracts.json" ]; then
  echo "❌ Failed to create /shared/contracts.json"
  exit 1
fi

echo "✅ Contract addresses saved to /shared/contracts.json"
echo ""
echo "📄 File contents:"
cat /shared/contracts.json
echo ""

# Verify JSON is valid
if node -e "JSON.parse(require('fs').readFileSync('/shared/contracts.json', 'utf8'))" 2>/dev/null; then
  echo "✅ JSON is valid!"
else
  echo "❌ JSON is invalid!"
  exit 1
fi

# Copy contract ABIs to shared volume
echo ""
echo "📄 Copying contract ABIs to /shared/abis..."
mkdir -p /shared/abis

# Copy with renamed Verifier
cp ./build/contracts/Groth16Verifier.json /shared/abis/Verifier.json
cp ./build/contracts/VoterRegistry.json /shared/abis/VoterRegistry.json
cp ./build/contracts/ElectionManager.json /shared/abis/ElectionManager.json
cp ./build/contracts/VotingSystem.json /shared/abis/VotingSystem.json

# Verify ABIs were copied
if [ -f "/shared/abis/ElectionManager.json" ] && \
   [ -f "/shared/abis/VotingSystem.json" ] && \
   [ -f "/shared/abis/Verifier.json" ]; then
  echo "✅ Contract ABIs copied successfully"
  echo "   Files in /shared/abis:"
  ls -lh /shared/abis/
else
  echo "❌ Failed to copy one or more ABIs"
  exit 1
fi

echo ""
echo "🎉 Deployment complete!"
exit 0
