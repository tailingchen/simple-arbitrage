# Logging System

The MEV arbitrage bot now includes a comprehensive logging system to help track workflow and debug issues.

## Dry Run Mode (Default)

The bot runs in dry run mode by default for safety. In this mode:
- All operations are performed normally (market evaluation, simulation, etc.)
- Bundle submission is skipped
- Detailed logs show what would have been submitted
- Perfect for testing on mainnet without risk

To enable LIVE mode (actual bundle submission):

```bash
# ⚠️  WARNING: This will submit real bundles!
DRY_RUN=false npm run start
```

To explicitly run in dry run mode:

```bash
# Safe mode (default)
DRY_RUN=true npm run start

# Or simply omit DRY_RUN
npm run start
```

## Log Levels

Set the log level using the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=DEBUG npm run start  # Show all logs including debug
LOG_LEVEL=INFO npm run start   # Default - show info and above
LOG_LEVEL=WARN npm run start   # Only warnings and errors
LOG_LEVEL=ERROR npm run start  # Only errors
```

## Log Categories

The logging system uses categories to organize different types of logs:

### Main Flow
- **STARTUP** - Bot initialization
- **CONFIG** - Configuration details
- **WALLET** - Wallet addresses
- **SETUP** - Provider setup
- **MARKETS** - Market loading
- **MONITOR** - Block monitoring
- **SHUTDOWN** - Graceful shutdown

### Arbitrage Detection
- **BLOCK** - New block notifications
- **RESERVES** - Reserve updates
- **EVALUATE** - Market evaluation
- **ARBITRAGE** - Arbitrage opportunities
- **OPPORTUNITY** - Profitable trades found

### Trade Execution
- **TRADE** - Trade preparation
- **CALLDATA** - Transaction data
- **REWARDS** - Miner rewards
- **GAS** - Gas estimation
- **BUNDLE** - Bundle preparation
- **SIMULATE** - Simulation results
- **SUBMIT** - Bundle submission
- **EXECUTE** - Execution status
- **DRY-RUN** - Dry run mode notifications

## Special Formatted Logs

The system includes special formatting for important events:

### Arbitrage Opportunities
```
═══════════════════════════════════════════════════════════
💰 ARBITRAGE OPPORTUNITY FOUND
═══════════════════════════════════════════════════════════
  Token: 0x...
  Profit: 1234567890 wei
  Volume: 9876543210 wei
  Buy from: Uniswap @ 0x...
  Sell to: Sushiswap @ 0x...
═══════════════════════════════════════════════════════════
```

### Bundle Submission
```
───────────────────────────────────────────────────────────
📦 BUNDLE SUBMITTED
───────────────────────────────────────────────────────────
  Target Blocks: 12345678, 12345679
  Effective Gas Price: 25.5 GWEI
  Profit to Miner: 0.05 ETH
───────────────────────────────────────────────────────────
```

### Dry Run Mode
```
[WARN ] [DRY-RUN] 🏃 DRY RUN - Bundle would be submitted to the following blocks:
{
  "targetBlocks": [12345678, 12345679],
  "simulationResult": {
    "profitToMiner": "0.05",
    "effectiveGasPrice": "25.5 GWEI",
    "totalGasUsed": "250000"
  }
}
[INFO ] [DRY-RUN] Bundle submission skipped (dry run mode)
```

## Debug Mode

Enable debug mode to see detailed information:
- Market evaluation details
- Gas estimation steps
- Bundle preparation
- Simulation parameters

## Monitoring

The logs provide real-time insights into:
- Number of blocks processed
- Markets evaluated per block
- Opportunities found vs executed
- Success/failure rates
- Gas costs and profits

This helps identify:
- Performance bottlenecks
- Failed transactions
- Unprofitable opportunities
- Network issues