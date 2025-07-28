import { formatEther } from "ethers/lib/utils";

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private formatTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, -1);
  }

  private colorize(text: string, color: string): string {
    return `${color}${text}${colors.reset}`;
  }

  private formatMessage(level: string, category: string, message: string, data?: any): string {
    const timestamp = this.colorize(this.formatTimestamp(), colors.gray);
    const levelStr = this.formatLevel(level);
    const categoryStr = this.colorize(`[${category}]`, colors.cyan);
    
    let output = `${timestamp} ${levelStr} ${categoryStr} ${message}`;
    
    if (data) {
      output += '\n' + this.colorize(JSON.stringify(data, null, 2), colors.gray);
    }
    
    return output;
  }

  private formatLevel(level: string): string {
    switch (level) {
      case 'DEBUG':
        return this.colorize('[DEBUG]', colors.gray);
      case 'INFO':
        return this.colorize('[INFO ]', colors.blue);
      case 'WARN':
        return this.colorize('[WARN ]', colors.yellow);
      case 'ERROR':
        return this.colorize('[ERROR]', colors.red);
      case 'SUCCESS':
        return this.colorize('[OK   ]', colors.green);
      default:
        return `[${level}]`;
    }
  }

  debug(category: string, message: string, data?: any) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', category, message, data));
    }
  }

  info(category: string, message: string, data?: any) {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', category, message, data));
    }
  }

  warn(category: string, message: string, data?: any) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', category, message, data));
    }
  }

  error(category: string, message: string, data?: any) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', category, message, data));
    }
  }

  success(category: string, message: string, data?: any) {
    console.log(this.formatMessage('SUCCESS', category, message, data));
  }

  // Special formatted logs for arbitrage opportunities
  arbitrage(market: any) {
    const profit = market.profit;
    const volume = market.volume;
    const buyFrom = market.buyFromMarket;
    const sellTo = market.sellToMarket;
    
    console.log(this.colorize('═══════════════════════════════════════════════════════════', colors.green));
    console.log(this.colorize(`${colors.bold}💰 ARBITRAGE OPPORTUNITY FOUND${colors.reset}`, colors.green));
    console.log(this.colorize('═══════════════════════════════════════════════════════════', colors.green));
    console.log(`  Token: ${this.colorize(market.tokenAddress, colors.yellow)}`);
    console.log(`  Profit: ${this.colorize(`${colors.bold}${formatEther(profit)}${colors.reset}`, colors.green)} eth`);
    console.log(`  Volume: ${this.colorize(formatEther(volume), colors.cyan)} eth`);
    console.log(`  Buy from: ${this.colorize(buyFrom.protocol, colors.blue)} @ ${buyFrom.marketAddress}`);
    console.log(`  Sell to: ${this.colorize(sellTo.protocol, colors.blue)} @ ${sellTo.marketAddress}`);
    console.log(this.colorize('═══════════════════════════════════════════════════════════', colors.green));
  }

  // Special formatted logs for bundle submission
  bundle(blockNumber: number, gasPrice: string, profitToMiner: string) {
    console.log(this.colorize('───────────────────────────────────────────────────────────', colors.magenta));
    console.log(this.colorize(`${colors.bold}📦 BUNDLE SUBMITTED${colors.reset}`, colors.magenta));
    console.log(this.colorize('───────────────────────────────────────────────────────────', colors.magenta));
    console.log(`  Target Blocks: ${this.colorize((blockNumber + 1).toString(), colors.cyan)}, ${this.colorize((blockNumber + 2).toString(), colors.cyan)}`);
    console.log(`  Effective Gas Price: ${this.colorize(gasPrice, colors.green)} GWEI`);
    console.log(`  Profit to Miner: ${this.colorize(profitToMiner, colors.yellow)} ETH`);
    console.log(this.colorize('───────────────────────────────────────────────────────────', colors.magenta));
  }
}

export const logger = new Logger();