#!/bin/bash

# Load environment variables
source .env

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Deploying FlashBotsUniswapQuery..."

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo -e "${RED}Error: RPC_URL not set in .env${NC}"
    exit 1
fi

# Create deployments directory if it doesn't exist
mkdir -p deployments

# Deploy using Foundry script
echo "Deploying FlashBotsUniswapQuery contract..."
forge script script/deploy/DeployUniswapFlashQuery.s.sol:DeployUniswapFlashQuery \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ FlashBotsUniswapQuery deployed successfully!${NC}"
    echo -e "${GREEN}Check deployments/ directory for deployment details${NC}"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check deployments/ directory for the contract address"
echo "2. The query contract can be used to efficiently fetch Uniswap pair data"