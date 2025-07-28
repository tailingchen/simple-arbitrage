import * as dotenv from 'dotenv';
dotenv.config();

import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Contract, providers, Wallet } from "ethers";
import { BUNDLE_EXECUTOR_ABI } from "./abi";
import { UniswappyV2EthPair } from "./UniswappyV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
import { Arbitrage } from "./Arbitrage";
import { get } from "https"
import { getDefaultRelaySigningKey } from "./utils";
import { logger } from "./logger";

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || ""

const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || getDefaultRelaySigningKey();

const MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "80")

if (PRIVATE_KEY === "") {
  console.warn("Must provide PRIVATE_KEY environment variable")
  process.exit(1)
}
if (BUNDLE_EXECUTOR_ADDRESS === "") {
  console.warn("Must provide BUNDLE_EXECUTOR_ADDRESS environment variable. Please see README.md")
  process.exit(1)
}

if (FLASHBOTS_RELAY_SIGNING_KEY === "") {
  console.warn("Must provide FLASHBOTS_RELAY_SIGNING_KEY. Please see https://github.com/flashbots/pm/blob/main/guides/searcher-onboarding.md")
  process.exit(1)
}

const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || ""

const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);

const arbitrageSigningWallet = new Wallet(PRIVATE_KEY);
const flashbotsRelaySigningWallet = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY);

function healthcheck() {
  if (HEALTHCHECK_URL === "") {
    return
  }
  get(HEALTHCHECK_URL).on('error', console.error);
}

async function main() {
  logger.info('STARTUP', '🚀 Starting MEV Arbitrage Bot');
  logger.info('CONFIG', `RPC URL: ${ETHEREUM_RPC_URL}`);
  logger.info('CONFIG', `Bundle Executor: ${BUNDLE_EXECUTOR_ADDRESS}`);
  logger.info('CONFIG', `Miner Reward: ${MINER_REWARD_PERCENTAGE}%`);
  
  if (process.env.DRY_RUN !== 'false') {
    logger.warn('CONFIG', '🏃 DRY RUN MODE - No bundles will be submitted');
  } else {
    logger.error('CONFIG', '⚠️  LIVE MODE ACTIVE - Real bundles will be submitted!');
  }
  
  const searcherAddress = await arbitrageSigningWallet.getAddress();
  const relaySignerAddress = await flashbotsRelaySigningWallet.getAddress();
  
  logger.info('WALLET', `Searcher Wallet: ${searcherAddress}`);
  logger.info('WALLET', `Flashbots Relay Signer: ${relaySignerAddress}`);
  
  logger.info('SETUP', 'Creating Flashbots provider...');
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
  logger.success('SETUP', 'Flashbots provider created');
  
  const arbitrage = new Arbitrage(
    arbitrageSigningWallet,
    flashbotsProvider,
    new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, provider)
  );

  logger.info('MARKETS', 'Loading Uniswap markets...');
  const markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
  logger.success('MARKETS', `Loaded ${markets.allMarketPairs.length} market pairs`);
  logger.info('MONITOR', 'Starting block monitoring...');
  let processedBlocks = 0;
  
  provider.on('block', async (blockNumber) => {
    processedBlocks++;
    logger.info('BLOCK', `New block: #${blockNumber} (processed: ${processedBlocks})`);
    
    logger.debug('RESERVES', 'Updating market reserves...');
    const updateStart = Date.now();
    await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
    logger.debug('RESERVES', `Updated in ${Date.now() - updateStart}ms`);
    
    logger.debug('EVALUATE', 'Searching for arbitrage opportunities...');
    const evalStart = Date.now();
    const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken);
    logger.debug('EVALUATE', `Evaluation completed in ${Date.now() - evalStart}ms`);
    
    if (bestCrossedMarkets.length === 0) {
      logger.info('ARBITRAGE', 'No profitable opportunities found');
      return
    }
    
    logger.success('ARBITRAGE', `Found ${bestCrossedMarkets.length} opportunities!`);
    bestCrossedMarkets.forEach(market => {
      logger.arbitrage(market);
      Arbitrage.printCrossedMarket(market);
    });
    
    logger.info('EXECUTE', 'Attempting to capture arbitrage...');
    arbitrage.takeCrossedMarkets(bestCrossedMarkets, blockNumber, MINER_REWARD_PERCENTAGE)
      .then(() => {
        logger.success('EXECUTE', 'Bundle submitted successfully');
        healthcheck();
      })
      .catch(error => {
        logger.error('EXECUTE', 'Failed to submit bundle', error);
        console.error(error);
      });
  })
}

main().catch(error => {
  logger.error('STARTUP', 'Failed to start bot', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SHUTDOWN', 'Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SHUTDOWN', 'Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
