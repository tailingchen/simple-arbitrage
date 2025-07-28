# Deployment Guide

This guide explains how to deploy the BundleExecutor contract to Sepolia testnet using Foundry.

## Prerequisites

1. [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
2. Sepolia ETH for gas fees
3. Private key with funds

## Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and add:
   - `PRIVATE_KEY`: Your wallet private key (with 0x prefix)
   - `SEPOLIA_RPC_URL`: Sepolia RPC endpoint (default provided)
   - `ETHERSCAN_API_KEY`: (Optional) For contract verification
   - `EXECUTOR_ADDRESS`: (Optional) Address that will execute bundles, defaults to deployer
   - `INITIAL_WETH_AMOUNT`: (Optional) Initial WETH to deposit in wei
   - `WETH_ADDRESS`: (Optional) Custom WETH address for other chains

## Deploy to Sepolia

Run the deployment script:

```bash
./deploy-sepolia.sh
```

This will:
1. Use Foundry script to deploy the contract
2. Automatically detect and use Sepolia WETH address
3. Save deployment info to `deployments/sepolia.json`
4. Verify the contract on Etherscan automatically

## Manual Deployment

If you prefer to deploy manually:

```bash
# Using Foundry script (recommended)
forge script script/DeployBundleExecutor.s.sol:DeployBundleExecutor \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify

# Or using forge create
forge create contracts/BundleExecutor.sol:FlashBotsMultiCall \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args <EXECUTOR_ADDRESS> <WETH_ADDRESS>
```

## Post-Deployment

1. Check `deployments/sepolia.json` for the deployed contract address
2. Copy the `bundleExecutorAddress` to your `.env` file as `BUNDLE_EXECUTOR_ADDRESS`
3. Fund the contract with WETH:
   - Send ETH to the contract address
   - Or deploy with `INITIAL_WETH_AMOUNT` set
4. Update the runtime RPC URL if needed (should be different from Flashbots RPC)

## Mainnet Deployment

For mainnet deployment:
1. Ensure `MAINNET_RPC_URL` is set in `.env`
2. Run: `forge script script/DeployBundleExecutor.s.sol:DeployBundleExecutor --rpc-url $MAINNET_RPC_URL --broadcast --verify`
3. The script automatically uses mainnet WETH address

## Contract Details

The upgraded contract:
- Uses Solidity ^0.8.29
- WETH address is passed via constructor for flexibility
- Supports any EVM chain with custom WETH address

### Default WETH Addresses
- **Sepolia**: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
- **Mainnet**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`

For other chains, set `WETH_ADDRESS` in your `.env` file.