import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from 'config';
import { UniswapService } from '../services/dex';
import { OkxService, BinanceService } from '../services/cex';
import { GetPriceResult } from '../types';
import { CSVBuilder } from '../report/csvBuilder';
import { TelegramClient } from './telegram.plugin';
import { ArbitrageOpportunityService } from '../services';
import { ArbitrageOpportunityRepository, ExchangeRepository, TradingPairRepository } from '../repositories';
import { PrismaClient } from '@prisma/client';
import { getMillisecondsFromInterval } from '../utils/main.util';

const initPlugin: FastifyPluginAsync = fp(async (fastify) => {
  console.log('3️⃣ registering init app...');
  new InitContainer(fastify.telegram, new CSVBuilder(), fastify.prisma).bootstrap();
});

class InitContainer {
  private reportRecords: any[] = [];
  private appConfig: any = config.get('application');
  private arbitrageService: ArbitrageOpportunityService;

  constructor(
    private telegram: TelegramClient,
    private reportBuilder: CSVBuilder,
    private prisma: PrismaClient
  ) {
    this.arbitrageService = new ArbitrageOpportunityService(
      new ArbitrageOpportunityRepository(this.prisma),
      new ExchangeRepository(this.prisma),
      new TradingPairRepository(this.prisma)
    );
  }

  public async bootstrap(): Promise<void> {
    try {
      this.startArbitrationProcess();
      this.startReporting();
    } catch (e) {
      console.log(e);
    }
  }

  public startReporting() {
    const chatIds = process.env.TELEGRAM_CHAT_IDS as string;
    const ids = chatIds.split(',');
    const reportingInterval = getMillisecondsFromInterval(this.appConfig.get('reportingInterval'));
    setInterval(async () => {
      if (!this.reportRecords.length) {
        ids.forEach(async (chatId) => {
          await this.telegram.sendMessage(chatId, '🗑️ No opportunities to arbitration.');
        });
        return;
      }
      const csv = this.reportBuilder.prepareDocument(this.reportRecords);
      ids.forEach(async (chatId) => {
        await this.telegram.sendDocument(chatId, csv);
      });
      this.reportRecords = [];
    }, reportingInterval);
  }

  public async startArbitrationProcess() {
    const priceTrackingInterval = getMillisecondsFromInterval(this.appConfig.get('priceTrackingInterval'));
    const activeExchanges = await this.prisma.exchange.findMany({ where: { status: 'active' } });
    const tradingPairs = await this.prisma.tradingPair.findMany();

    setInterval(async () => {
      console.log('🎬', new Date().toISOString());
      const pairsToMonitor = this.appConfig.pairsToMonitor;

      for (const pair of pairsToMonitor) {
        const promises: Promise<any>[] = [];
        promises.push(this.uniswap(pair));
        promises.push(this.binance(pair));
        promises.push(this.okx(pair));
        const [uniswap, binance, okx] = await Promise.all(promises);
        const exchangeValues = [uniswap, binance, okx];
        const valid = this.validateOpportunity(exchangeValues);

        if (valid.isValid) {
          const currentTime = new Date().toISOString();

          // const createdResult = await this.arbitrageService.createArbitrageOpportunity({ ...valid, currentTime });
          // console.log(createdResult);

          const payload = {
            results: [uniswap, binance, okx],
            maxShift: valid.maxShift,
            currentTime: currentTime,
          }
          this.reportRecords.push(payload);
        }
      }

      console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
    }, priceTrackingInterval);
  }

  private async uniswap(pair: string): Promise<GetPriceResult> {
    const uniswapConfig: any = config.get('exchanges.uniswap');
    const pairConfig: any = uniswapConfig[pair];
    const netName: string = this.appConfig.get('netByPair')[pair];
    const netUrlName: string = this.appConfig.get('urlByNet')[netName];
    const uniswapService: UniswapService = new UniswapService(netName, netUrlName, pairConfig);

    const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Uniswap');
    console.log(result);

    return result;
  }

  private async binance(pair: string): Promise<GetPriceResult> {
    const binanceConfig: any = config.get('exchanges.binance');
    const pairConfig: any = binanceConfig[pair];

    const binanceService: BinanceService = new BinanceService(binanceConfig, pair);
    const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Binance');
    console.log(result);

    return result;
  }

  public async okx(pair: string): Promise<GetPriceResult> {
    const okxConfig: any = config.get('exchanges.okx');
    const pairConfig: any = okxConfig[pair];

    const okxService = new OkxService(okxConfig, pair);
    const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'OKX');
    console.log(result);

    return result;
  }

  private formatGetPriceResult(pairConfig: any, buyOneOfToken0: number, provider: string): GetPriceResult {
    const token0Symbol: string = pairConfig.get('token0Symbol');
    return { provider, pair: token0Symbol, price: buyOneOfToken0 };
  }

  private validateOpportunity(values: GetPriceResult[]) {
    const opportunityThreshold = this.appConfig.get('opportunityThreshold');

    let maxExchanger = { ...values[0] };
    let minExchanger = { ...values[0] };

    values.forEach((value: GetPriceResult) => {
      if (value.price > maxExchanger.price) {
        maxExchanger.price = value.price;
        maxExchanger.provider = value.provider;
      }
      if (value.price < minExchanger.price) {
        minExchanger.price = value.price;
        minExchanger.provider = value.provider
      }
    });

    const maxShift = maxExchanger.price - minExchanger.price;
    const priceDifference = maxExchanger.price / minExchanger.price - 1;

    return {
      isValid: priceDifference >= opportunityThreshold,
      maxShift: maxShift,
      potentialSellExchange: maxExchanger.provider,
      potentialBuyExchange: minExchanger.provider
    };
  }
}

export { initPlugin };


// 1. Set up Exchanges: +

// Create Exchange records for each cryptocurrency exchange you want to work with.
// Set the status to 'active' for exchanges you want to use.


// 2. Add Cryptocurrencies:

// Create Cryptocurrency records for all the cryptocurrencies you want to track.
// Ensure to set the correct symbol, name, and decimalPlaces for each.


// 3. Define Trading Pairs:

// Create TradingPair records for each combination of cryptocurrencies you want to trade.
// Link each TradingPair to its respective Exchange, baseCurrency, and quoteCurrency.
// Set minOrderSize, maxOrderSize, and tradingFee for each pair.


// 4. Update Order Books:

// Regularly fetch and update OrderBook records for each TradingPair.
// This will give you current market prices and volumes.

// 5. Identify Arbitrage Opportunities:

// Analyze OrderBook data across different exchanges to find price discrepancies.
// When an opportunity is found, create an ArbitrageOpportunity record.


// 6. Execute Transactions:

// Based on identified opportunities, create Transaction records.
// Update the status of transactions as they progress (pending -> completed or failed).


// 7. Manage Users:

// Create User records for individuals using your system.
// Keep track of their login activity.


// 8. Track User Balances:

// Create and update UserBalance records to keep track of each user's cryptocurrency holdings.

// Continuous Monitoring and Updating:

// Regularly update OrderBook data.
// Look for new arbitrage opportunities.
// Execute transactions when profitable.
// Update user balances after successful transactions.