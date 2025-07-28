#!/bin/bash

# Load environment variables
source .env

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Deploying BundleExecutor to Sepolia..."

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo -e "${RED}Error: SEPOLIA_RPC_URL not set in .env${NC}"
    exit 1
fi

# Create deployments directory if it doesn't exist
mkdir -p deployments

# Deploy using Foundry script
echo "Deploying contract using Foundry script..."
forge script script/DeployBundleExecutor.s.sol:DeployBundleExecutor \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ BundleExecutor deployed successfully!${NC}"
    echo -e "${GREEN}Check deployments/sepolia.json for deployment details${NC}"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check deployments/sepolia.json for the BUNDLE_EXECUTOR_ADDRESS"
echo "2. Copy the address to your .env file"
echo "3. Fund the contract with WETH if needed"
echo "4. Run the arbitrage bot with: npm run start"