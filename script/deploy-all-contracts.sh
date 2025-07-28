#!/bin/bash

# Load environment variables
source .env

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying all contracts to Sepolia...${NC}"
echo ""

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

# Deploy BundleExecutor
echo -e "${BLUE}[1/2] Deploying BundleExecutor...${NC}"
forge script script/deploy/DeployBundleExecutor.s.sol:DeployBundleExecutor \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    -vvvv

if [ $? -ne 0 ]; then
    echo -e "${RED}BundleExecutor deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ BundleExecutor deployed successfully!${NC}"
echo ""

# Deploy FlashBotsUniswapQuery
echo -e "${BLUE}[2/2] Deploying FlashBotsUniswapQuery...${NC}"
forge script script/deploy/DeployUniswapFlashQuery.s.sol:DeployUniswapFlashQuery \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    -vvvv

if [ $? -ne 0 ]; then
    echo -e "${RED}FlashBotsUniswapQuery deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ FlashBotsUniswapQuery deployed successfully!${NC}"

echo ""
echo -e "${GREEN}🎉 All contracts deployed successfully!${NC}"
echo ""
echo "Deployment files:"
echo "  - BundleExecutor: deployments/sepolia.json"
echo "  - FlashBotsUniswapQuery: deployments/sepolia-query.json"
echo ""
echo "Next steps:"
echo "1. Copy the BUNDLE_EXECUTOR_ADDRESS from deployments/sepolia.json to your .env file"
echo "2. Fund the BundleExecutor contract with WETH if needed"
echo "3. Run the arbitrage bot with: npm run start"