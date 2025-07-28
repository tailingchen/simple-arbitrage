#!/bin/bash

# Load environment variables
source .env

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Default values
FORK_BLOCK="latest"
PORT=8545

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --block)
            FORK_BLOCK="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Check if RPC_URL is set
if [ -z "$RPC_URL" ]; then
    echo -e "${RED}Error: RPC_URL not set in .env${NC}"
    exit 1
fi

echo -e "${BLUE}🍴 Starting Anvil fork...${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  RPC URL: $RPC_URL"
echo "  Fork Block: $FORK_BLOCK"
echo "  Local Port: $PORT"
echo ""

# Start Anvil fork
anvil \
    --fork-url $RPC_URL \
    --fork-block-number $FORK_BLOCK \
    --port $PORT \
    --accounts 10 \
    --balance 10000 \
    --mnemonic "test test test test test test test test test test test junk"

# Note: This will run until you stop it with Ctrl+C