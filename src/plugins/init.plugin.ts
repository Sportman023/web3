import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from 'config';
import { UniswapService } from '../services/dex';
import { OkxService, BinanceService } from '../services/cex';
import { GetPriceResult } from '../types';
import { CSVBuilder } from '../report/csvBuilder';
import { TelegramClient } from './telegram.plugin';
import { ArbitrageOpportunityService } from '../services';
import { ArbitrageOpportunityRepository } from '../repositories';
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
      new ArbitrageOpportunityRepository(this.prisma)
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
    const tradingPairs = await this.prisma.tradingPair.findMany({
      where: {
        AND: [
          { status: 'active' },
          {
            exchange: {
              status: 'active'
            }
          }
        ]
      },
      include: {
        exchange: true
      }
    });

    setInterval(async () => {
      console.log('🎬', new Date().toISOString());

      const tradingPairByPair: Record<string, any[]> = {};

      for (const tradingPair of tradingPairs) {
        if (tradingPairByPair[tradingPair.name]) {
          const exchanges = tradingPairByPair[tradingPair.name];
          exchanges.push(tradingPair);
        } else {
          tradingPairByPair[tradingPair.name] = [tradingPair];
        }
      }

      for (const pair of Object.keys(tradingPairByPair)) {
        const tradingPairs = tradingPairByPair[pair];
        const promises: Promise<GetPriceResult>[] = [];
        for (const tradingPair of tradingPairs) {
          const func = this.functionMap[tradingPair.exchange.name.toLowerCase()];
          if (func) {
            const result = func(pair);
            promises.push(result);
          }
        }

        const result = await Promise.all(promises);
        const valid = this.validateOpportunity(result);

        if (valid.isValid) {
          const currentTime = new Date().toISOString();
          const potentialBuyExchangeId = tradingPairs.find(tradingPair => tradingPair.exchange.name === valid.potentialBuyExchange)?.exchangeId;
          const potentialSellExchangeId = tradingPairs.find(tradingPair => tradingPair.exchange.name === valid.potentialSellExchange)?.exchangeId;
          const createdResult = await this.arbitrageService.createArbitrageOpportunity({
            ...valid,
            currentTime,
            potentialBuyExchangeId,
            potentialSellExchangeId,
            pair
          });
          console.log(createdResult);
        }
      }

      console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
    }, priceTrackingInterval);
  }

  private uniswap = async (pair: string): Promise<GetPriceResult> => {
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

  private binance = async (pair: string): Promise<GetPriceResult> => {
    const binanceConfig: any = config.get('exchanges.binance');
    const pairConfig: any = binanceConfig[pair];

    const binanceService: BinanceService = new BinanceService(binanceConfig, pair);
    const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Binance');
    console.log(result);

    return result;
  }

  public okx = async (pair: string): Promise<GetPriceResult> => {
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

  private functionMap: { [key: string]: (pair: string) => Promise<GetPriceResult> } = {
    uniswap: this.uniswap,
    okx: this.okx,
    binance: this.binance
  };
}

export { initPlugin };