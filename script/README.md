# Deployment Scripts

This directory contains scripts for deploying and testing the arbitrage bot contracts.

## Simulation Scripts

For testing deployments before going to mainnet/testnet:

- `start-fork.sh` - Starts an Anvil fork of Sepolia for local testing
- `simulate-deploy.sh` - Deploys contracts to the local fork for testing

## Deployment Scripts

- `deploy-all-contracts.sh` - Deploys both BundleExecutor and FlashBotsUniswapQuery contracts
- `deploy-bundle-executor.sh` - Deploys only the BundleExecutor contract (main arbitrage executor)
- `deploy-uniswap-query.sh` - Deploys only the FlashBotsUniswapQuery contract (helper for batch queries)

All scripts:
- Use environment variables from `.env`
- Deploy to the network specified by `SEPOLIA_RPC_URL` or `MAINNET_RPC_URL`
- Automatically verify contracts on Etherscan if `ETHERSCAN_API_KEY` is provided
- Save deployment info to JSON files in the `deployments/` directory

## Solidity Deploy Scripts

Located in the `deploy/` subdirectory:

- `DeployBundleExecutor.s.sol` - Foundry script for deploying BundleExecutor
- `DeployUniswapFlashQuery.s.sol` - Foundry script for deploying FlashBotsUniswapQuery

These scripts:
- Automatically detect the correct WETH address based on chain ID
- Support custom WETH addresses via environment variables
- Save deployment information with block number and timestamp

## Recommended Workflow

1. **Test locally first:**
   ```bash
   # Terminal 1: Start fork
   ./script/start-fork.sh
   
   # Terminal 2: Simulate deployment
   ./script/simulate-deploy.sh
   ```

2. **Deploy to testnet/mainnet:**
   ```bash
   # Deploy everything
   ./script/deploy-all-contracts.sh
   
   # Or deploy individual contracts
   ./script/deploy-bundle-executor.sh
   ./script/deploy-uniswap-query.sh
   ```

3. **Check deployment results:**
   - Simulation: `deployments/11155111.json` (chain ID for Sepolia fork)
   - Sepolia: `deployments/sepolia.json`
   - Mainnet: `deployments/mainnet.json`

## Environment Setup

- `.env` - Production environment variables
- `.env.local.example` - Template for local testing with Anvil

Always test deployments on a fork before deploying to real networks!