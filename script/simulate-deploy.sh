#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Anvil test account (from mnemonic "test test test test test test test test test test test junk")
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
TEST_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
FORK_RPC_URL="http://127.0.0.1:8545"

echo -e "${BLUE}🧪 Simulating deployment on local fork...${NC}"
echo ""

# Check if Anvil is running
if ! curl -s $FORK_RPC_URL > /dev/null 2>&1; then
    echo -e "${RED}Error: Anvil is not running on $FORK_RPC_URL${NC}"
    echo -e "${YELLOW}Please run ./script/start-fork.sh first${NC}"
    exit 1
fi

# Create temporary env file for simulation
TEMP_ENV=".env.simulate"
cp .env $TEMP_ENV

# Override with test values
cat >> $TEMP_ENV << EOF

# Simulation overrides
PRIVATE_KEY=$TEST_PRIVATE_KEY
SEPOLIA_RPC_URL=$FORK_RPC_URL
EOF

echo -e "${YELLOW}Using test account:${NC}"
echo "  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  Balance: 10000 ETH"
echo ""

# Deploy all contracts
echo -e "${BLUE}Deploying contracts...${NC}"
echo ""

# Run deployment with temporary env
(
    # Export the temp env vars
    set -a
    source $TEMP_ENV
    set +a
    
    # Deploy BundleExecutor
    echo -e "${BLUE}[1/2] Deploying BundleExecutor...${NC}"
    forge script script/deploy/DeployBundleExecutor.s.sol:DeployBundleExecutor \
        --rpc-url $FORK_RPC_URL \
        --broadcast \
        -vvv
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}BundleExecutor deployment failed!${NC}"
        rm $TEMP_ENV
        exit 1
    fi
    
    echo -e "${GREEN}✅ BundleExecutor deployed successfully!${NC}"
    echo ""
    
    # Deploy FlashBotsUniswapQuery
    echo -e "${BLUE}[2/2] Deploying FlashBotsUniswapQuery...${NC}"
    forge script script/deploy/DeployUniswapFlashQuery.s.sol:DeployUniswapFlashQuery \
        --rpc-url $FORK_RPC_URL \
        --broadcast \
        -vvv
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}FlashBotsUniswapQuery deployment failed!${NC}"
        rm $TEMP_ENV
        exit 1
    fi
    
    echo -e "${GREEN}✅ FlashBotsUniswapQuery deployed successfully!${NC}"
)

# Clean up
rm $TEMP_ENV

echo ""
echo -e "${GREEN}🎉 Simulation complete!${NC}"
echo ""
echo "Deployment files saved to:"
echo "  - deployments/11155111.json (BundleExecutor)"
echo "  - deployments/11155111-query.json (FlashBotsUniswapQuery)"
echo ""
echo -e "${YELLOW}Note: These are simulation deployments on a local fork.${NC}"
echo -e "${YELLOW}To deploy to real Sepolia, use ./script/deploy-all-contracts.sh${NC}"