import * as _ from "lodash";
import { BigNumber, Contract, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { WETH_ADDRESS } from "./addresses";
import { EthMarket } from "./EthMarket";
import { ETHER, bigNumberToDecimal } from "./utils";
import { logger } from "./logger";

export interface CrossedMarketDetails {
  profit: BigNumber,
  volume: BigNumber,
  tokenAddress: string,
  buyFromMarket: EthMarket,
  sellToMarket: EthMarket,
}

export type MarketsByToken = { [tokenAddress: string]: Array<EthMarket> }

// TODO: implement binary search (assuming linear/exponential global maximum profitability)
const TEST_VOLUMES = [
  ETHER.div(100),
  ETHER.div(10),
  ETHER.div(6),
  ETHER.div(4),
  ETHER.div(2),
  ETHER.div(1),
  ETHER.mul(2),
  ETHER.mul(5),
  ETHER.mul(10),
]

export function getBestCrossedMarket(crossedMarkets: Array<EthMarket>[], tokenAddress: string): CrossedMarketDetails | undefined {
  let bestCrossedMarket: CrossedMarketDetails | undefined = undefined;
  for (const crossedMarket of crossedMarkets) {
    const sellToMarket = crossedMarket[0]
    const buyFromMarket = crossedMarket[1]
    for (const size of TEST_VOLUMES) {
      const tokensOutFromBuyingSize = buyFromMarket.getTokensOut(WETH_ADDRESS, tokenAddress, size);
      const proceedsFromSellingTokens = sellToMarket.getTokensOut(tokenAddress, WETH_ADDRESS, tokensOutFromBuyingSize)
      const profit = proceedsFromSellingTokens.sub(size);
      if (bestCrossedMarket !== undefined && profit.lt(bestCrossedMarket.profit)) {
        // If the next size up lost value, meet halfway. TODO: replace with real binary search
        const trySize = size.add(bestCrossedMarket.volume).div(2)
        const tryTokensOutFromBuyingSize = buyFromMarket.getTokensOut(WETH_ADDRESS, tokenAddress, trySize);
        const tryProceedsFromSellingTokens = sellToMarket.getTokensOut(tokenAddress, WETH_ADDRESS, tryTokensOutFromBuyingSize)
        const tryProfit = tryProceedsFromSellingTokens.sub(trySize);
        if (tryProfit.gt(bestCrossedMarket.profit)) {
          bestCrossedMarket = {
            volume: trySize,
            profit: tryProfit,
            tokenAddress,
            sellToMarket,
            buyFromMarket
          }
        }
        break;
      }
      bestCrossedMarket = {
        volume: size,
        profit: profit,
        tokenAddress,
        sellToMarket,
        buyFromMarket
      }
    }
  }
  return bestCrossedMarket;
}

export class Arbitrage {
  private flashbotsProvider: FlashbotsBundleProvider;
  private bundleExecutorContract: Contract;
  private executorWallet: Wallet;
  private isDryRun: boolean;

  constructor(executorWallet: Wallet, flashbotsProvider: FlashbotsBundleProvider, bundleExecutorContract: Contract) {
    this.executorWallet = executorWallet;
    this.flashbotsProvider = flashbotsProvider;
    this.bundleExecutorContract = bundleExecutorContract;
    // Default to dry run mode unless explicitly set to 'false'
    this.isDryRun = process.env.DRY_RUN !== 'false';
    
    if (this.isDryRun) {
      logger.warn('CONFIG', '🏃 DRY RUN MODE ENABLED - Bundles will NOT be submitted to Flashbots');
    } else {
      logger.warn('CONFIG', '⚠️  LIVE MODE - Bundles WILL be submitted to Flashbots!');
    }
  }

  static printCrossedMarket(crossedMarket: CrossedMarketDetails): void {
    const buyTokens = crossedMarket.buyFromMarket.tokens
    const sellTokens = crossedMarket.sellToMarket.tokens
    console.log(
      `Profit: ${bigNumberToDecimal(crossedMarket.profit)} Volume: ${bigNumberToDecimal(crossedMarket.volume)}\n` +
      `${crossedMarket.buyFromMarket.protocol} (${crossedMarket.buyFromMarket.marketAddress})\n` +
      `  ${buyTokens[0]} => ${buyTokens[1]}\n` +
      `${crossedMarket.sellToMarket.protocol} (${crossedMarket.sellToMarket.marketAddress})\n` +
      `  ${sellTokens[0]} => ${sellTokens[1]}\n` +
      `\n`
    )
  }


  async evaluateMarkets(marketsByToken: MarketsByToken): Promise<Array<CrossedMarketDetails>> {
    const bestCrossedMarkets = new Array<CrossedMarketDetails>()
    let totalTokensEvaluated = 0;
    let totalMarketsChecked = 0;

    for (const tokenAddress in marketsByToken) {
      totalTokensEvaluated++;
      const markets = marketsByToken[tokenAddress]
      logger.debug('EVALUATE', `Checking ${markets.length} markets for token ${tokenAddress}`);
      
      const pricedMarkets = _.map(markets, (ethMarket: EthMarket) => {
        totalMarketsChecked++;
        return {
          ethMarket: ethMarket,
          buyTokenPrice: ethMarket.getTokensIn(tokenAddress, WETH_ADDRESS, ETHER.div(100)),
          sellTokenPrice: ethMarket.getTokensOut(WETH_ADDRESS, tokenAddress, ETHER.div(100)),
        }
      });

      const crossedMarkets = new Array<Array<EthMarket>>()
      for (const pricedMarket of pricedMarkets) {
        _.forEach(pricedMarkets, pm => {
          if (pm.sellTokenPrice.gt(pricedMarket.buyTokenPrice)) {
            crossedMarkets.push([pricedMarket.ethMarket, pm.ethMarket])
          }
        })
      }

      if (crossedMarkets.length > 0) {
        logger.debug('ARBITRAGE', `Found ${crossedMarkets.length} crossed markets for ${tokenAddress}`);
      }

      const bestCrossedMarket = getBestCrossedMarket(crossedMarkets, tokenAddress);
      if (bestCrossedMarket !== undefined && bestCrossedMarket.profit.gt(ETHER.div(1000))) {
        logger.info('OPPORTUNITY', `Profitable arbitrage found for ${tokenAddress}`, {
          profit: bigNumberToDecimal(bestCrossedMarket.profit),
          volume: bigNumberToDecimal(bestCrossedMarket.volume)
        });
        bestCrossedMarkets.push(bestCrossedMarket)
      }
    }
    
    logger.debug('EVALUATE', `Evaluated ${totalTokensEvaluated} tokens across ${totalMarketsChecked} markets`);
    bestCrossedMarkets.sort((a, b) => a.profit.lt(b.profit) ? 1 : a.profit.gt(b.profit) ? -1 : 0)
    return bestCrossedMarkets
  }

  // TODO: take more than 1
  async takeCrossedMarkets(bestCrossedMarkets: CrossedMarketDetails[], blockNumber: number, minerRewardPercentage: number): Promise<void> {
    logger.info('BUNDLE', `Processing ${bestCrossedMarkets.length} arbitrage opportunities`);
    
    for (const bestCrossedMarket of bestCrossedMarkets) {
      logger.info('TRADE', 'Preparing arbitrage transaction', {
        token: bestCrossedMarket.tokenAddress,
        volumeWETH: bigNumberToDecimal(bestCrossedMarket.volume),
        expectedProfit: bigNumberToDecimal(bestCrossedMarket.profit),
        buyFrom: bestCrossedMarket.buyFromMarket.marketAddress,
        sellTo: bestCrossedMarket.sellToMarket.marketAddress
      });

      const buyCalls = await bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(WETH_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket);
      const inter = bestCrossedMarket.buyFromMarket.getTokensOut(WETH_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume)
      const sellCallData = await bestCrossedMarket.sellToMarket.sellTokens(bestCrossedMarket.tokenAddress, inter, this.bundleExecutorContract.address);

      const targets: Array<string> = [...buyCalls.targets, bestCrossedMarket.sellToMarket.marketAddress]
      const payloads: Array<string> = [...buyCalls.data, sellCallData]
      
      logger.debug('CALLDATA', 'Transaction calls prepared', {
        targetCount: targets.length,
        targets: targets
      });
      
      const minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
      logger.info('REWARDS', `Miner reward: ${bigNumberToDecimal(minerReward)} ETH (${minerRewardPercentage}% of profit)`);
      const transaction = await this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, {
        gasPrice: BigNumber.from(0),
        gasLimit: BigNumber.from(1000000),
      });

      try {
        logger.debug('GAS', 'Estimating gas...');
        const estimateGas = await this.bundleExecutorContract.provider.estimateGas(
          {
            ...transaction,
            from: this.executorWallet.address
          })
        
        logger.info('GAS', `Estimated gas: ${estimateGas.toString()}`);
        
        if (estimateGas.gt(1400000)) {
          logger.warn('GAS', `Gas estimate suspiciously high: ${estimateGas.toString()}`);
          continue
        }
        transaction.gasLimit = estimateGas.mul(2)
        logger.debug('GAS', `Gas limit set to: ${transaction.gasLimit.toString()}`);
      } catch (e: any) {
        logger.error('GAS', 'Gas estimation failed', {
          token: bestCrossedMarket.tokenAddress,
          error: e.message || e.toString()
        });
        continue
      }
      const bundledTransactions = [
        {
          signer: this.executorWallet,
          transaction: transaction
        }
      ];
      logger.debug('BUNDLE', 'Signing bundle...');
      const signedBundle = await this.flashbotsProvider.signBundle(bundledTransactions)
      
      logger.info('SIMULATE', 'Running bundle simulation...');
      const simulation = await this.flashbotsProvider.simulate(signedBundle, blockNumber + 1 )
      
      if ("error" in simulation || simulation.firstRevert !== undefined) {
        logger.error('SIMULATE', 'Simulation failed', {
          token: bestCrossedMarket.tokenAddress,
          error: "error" in simulation ? simulation.error : 'Transaction reverted',
          firstRevert: "firstRevert" in simulation ? simulation.firstRevert : "Unknown first revert"
        });
        continue
      }
      
      const effectiveGasPrice = bigNumberToDecimal(simulation.coinbaseDiff.div(simulation.totalGasUsed), 9);
      logger.success('SIMULATE', 'Simulation successful', {
        profitToMiner: bigNumberToDecimal(simulation.coinbaseDiff),
        effectiveGasPrice: `${effectiveGasPrice} GWEI`,
        totalGasUsed: simulation.totalGasUsed.toString()
      });
      
      // Submit bundle (or dry run)
      await this.submitBundle(signedBundle, blockNumber, simulation);
      return
    }
    logger.error('BUNDLE', 'No arbitrage opportunities could be submitted to relay');
    throw new Error("No arbitrage submitted to relay")
  }

  private async submitBundle(signedBundle: string[], blockNumber: number, simulation: any): Promise<void> {
    const targetBlocks = [blockNumber + 1, blockNumber + 2];
    
    if (this.isDryRun) {
      logger.warn('DRY-RUN', '🏃 DRY RUN - Bundle would be submitted to the following blocks:', {
        targetBlocks,
        simulationResult: {
          profitToMiner: bigNumberToDecimal(simulation.coinbaseDiff),
          effectiveGasPrice: bigNumberToDecimal(simulation.coinbaseDiff.div(simulation.totalGasUsed), 9) + ' GWEI',
          totalGasUsed: simulation.totalGasUsed.toString()
        }
      });
      
      logger.info('DRY-RUN', 'Bundle submission skipped (dry run mode)');
      return;
    }
    
    logger.info('SUBMIT', `Submitting bundle for blocks ${targetBlocks.join(', ')}`);
    
    const bundlePromises = targetBlocks.map(targetBlockNumber => {
      logger.debug('SUBMIT', `Sending to block ${targetBlockNumber}`);
      return this.flashbotsProvider.sendRawBundle(
        signedBundle,
        targetBlockNumber
      );
    });
    
    await Promise.all(bundlePromises);
    logger.success('BUNDLE', `Bundle sent to Flashbots relay for blocks ${targetBlocks.join(', ')}`);
  }
}
