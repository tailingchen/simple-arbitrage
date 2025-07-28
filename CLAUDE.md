# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development & Testing
```bash
# Install dependencies
npm install

# Start the arbitrage bot (requires environment variables)
npm run start

# Run tests with Jasmine
npm test

# Build TypeScript to JavaScript
npm run build

# Lint the codebase
npm run lint
```

### Environment Variables Required
- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint (cannot be same as Flashbots RPC)
- `PRIVATE_KEY` - Private key for the EOA submitting transactions
- `BUNDLE_EXECUTOR_ADDRESS` - Address of deployed BundleExecutor contract
- `FLASHBOTS_RELAY_SIGNING_KEY` - (Optional) Key for signing Flashbots submissions
- `MINER_REWARD_PERCENTAGE` - (Optional, default 80) Percentage of profit to send to miner
- `HEALTHCHECK_URL` - (Optional) URL to hit after successful bundle submission

## Architecture Overview

This is a Flashbots MEV searcher bot that finds and executes arbitrage opportunities between Uniswap V2-style DEXes.

### Core Components

1. **Entry Point** (`src/index.ts`)
   - Initializes provider connections and wallets
   - Sets up market monitoring on each new block
   - Orchestrates the arbitrage detection and execution flow

2. **Arbitrage Engine** (`src/Arbitrage.ts`)
   - Evaluates markets for profitable arbitrage opportunities
   - Calculates optimal trade volumes using predefined test volumes
   - Submits profitable trades as Flashbots bundles

3. **Market Representation** (`src/UniswappyV2EthPair.ts` & `src/EthMarket.ts`)
   - Models Uniswap V2-style ETH pairs
   - Tracks and updates reserve states
   - Calculates token output amounts for trades

4. **Smart Contracts** (`contracts/`)
   - `BundleExecutor.sol` - On-chain executor that ensures atomic arbitrage execution
   - `UniswapFlashQuery.sol` - Helper for querying Uniswap state

### Key Architectural Decisions

- Uses Flashbots bundle submission to avoid frontrunning
- Monitors multiple DEX factories simultaneously (defined in `src/addresses.ts`)
- Tests multiple volume sizes to find optimal arbitrage amount
- Requires pre-deployed BundleExecutor contract funded with WETH
- All arbitrage profits are calculated in WETH

### Testing Approach

The project uses Jasmine for testing. Test files are located in the `test/` directory and follow the `*.test.ts` naming convention.