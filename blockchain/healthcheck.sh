#!/bin/sh

# Check if contracts.json exists and is valid
if [ -f "/shared/contracts.json" ]; then
  # Check if file has contract addresses
  if grep -q "ElectionManager" /shared/contracts.json && \
     grep -q "VotingSystem" /shared/contracts.json; then
    exit 0
  fi
fi

exit 1
