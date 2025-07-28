# Deployment Scripts

This directory contains scripts for deploying the arbitrage bot contracts.

## Bash Scripts

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

## Usage

1. Set up your `.env` file with required variables
2. Run the desired deployment script:
   ```bash
   # Deploy everything
   ./script/deploy-all-contracts.sh
   
   # Deploy individual contracts
   ./script/deploy-bundle-executor.sh
   ./script/deploy-uniswap-query.sh
   ```
3. Check `deployments/` directory for deployment details