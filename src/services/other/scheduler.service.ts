import scheduler from 'node-schedule';
import { DBService } from './db.service';
import { TelegramClient } from './telegram.service';
import { CSVService } from './csv.service';
import { GetPriceResult } from '../../types';
import { ExchangeService } from './exchange.service';

export class SchedulerService {

  constructor(
    private dbService: DBService, private telegram: TelegramClient,
    private reportBuilder: CSVService, private exService: ExchangeService,
    private config: any
  ) {}

  public async start() {
    console.log('scheduler registered...');
    this.exService.setConfig(this.config);
    const tradingPairs = await this.dbService.findActiveTradingPairs();

    scheduler.scheduleJob('* 4 * * *', async () => {
      console.log('reporting job started...');
      this.executeReporting();
    });

    // this.executeTrackingPairs();

    scheduler.scheduleJob('*/1 * * * *', async () => {
      console.log('currency job started...');
      this.executeTrackingPairs(tradingPairs);
    });
  }

  private async executeTrackingPairs(tradingPairs: any[]) {
    console.log('🎬', new Date().toISOString());
    const tradingPairByPair: Record<string, any[]> = {};

    for (const tradingPair of tradingPairs) {
      if (tradingPairByPair[tradingPair.name]) {
        tradingPairByPair[tradingPair.name].push(tradingPair);
      } else {
        tradingPairByPair[tradingPair.name] = [tradingPair];
      }
    }

    for (const pair of Object.keys(tradingPairByPair)) {
      const tradingPairs = tradingPairByPair[pair];
      const promises: Promise<GetPriceResult>[] = [];
      for (const tradingPair of tradingPairs) {
        const exchangeName = tradingPair.exchange.name.toLowerCase();
        const result = this.exService.getPriceByExchange(exchangeName, pair);
        promises.push(result);
      }

      const result = await Promise.allSettled(promises);
      const splittedResult: Record<string, any[]> = {
        success: [],
        failed: []
      }

      result.forEach(item => {
        if (item.status == 'fulfilled') {
          splittedResult.success.push(item.value);
        } else {
          splittedResult.failed.push(item.reason);
        }
      })

      // splittedResult.failed - save to log?
      if (splittedResult.failed.length) {
        console.log(`\x1B[31m${splittedResult.failed}\x1b[0m`);
      }

      console.log('🏁 \x1b[36m%s\x1b[0m', JSON.stringify(splittedResult.success));

      const valid = this.validateOpportunity(splittedResult.success);

      if (valid.isValid) {
        const currentTime = new Date().toISOString();
        const potentialBuyExchangeId = tradingPairs.find(tradingPair => tradingPair.exchange.name === valid.potentialBuyExchange)?.exchangeId;
        const potentialSellExchangeId = tradingPairs.find(tradingPair => tradingPair.exchange.name === valid.potentialSellExchange)?.exchangeId;
        const createdResult = await this.dbService.createArbitrageOpportunity({
          ...valid,
          currentTime,
          potentialBuyExchangeId,
          potentialSellExchangeId,
          pair
        });
        console.log(`📗 ${createdResult.tradingPairName}: \x1b[34mBuy on ${valid.potentialBuyExchange} and Sell on ${valid.potentialSellExchange} profit will ${createdResult.profitPercentage.toFixed(2)}% \x1b[0m`);
      }
    }

    console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
  }

  private async executeReporting() {
    const chatIds = process.env.TELEGRAM_CHAT_IDS as string;
    const ids = chatIds.split(',');
    const opportunities = await this.dbService.findAllArbitrageOpportunities(); // TODO: select only for last *h
    if (!opportunities.length) {
      ids.forEach(async (chatId) => {
        await this.telegram.sendMessage(chatId, '🗑️ No opportunities to arbitration.');
      });
      return;
    }
    const csv = this.reportBuilder.prepareDocument(opportunities);
    ids.forEach(async (chatId) => {
      await this.telegram.sendDocument(chatId, csv);
    });
  }

  private validateOpportunity(values: GetPriceResult[]) {
    const opportunityThreshold = this.config.get('application.opportunityThreshold');

    let maxExchanger = { ...values[0] };
    let minExchanger = { ...values[0] };

    values.forEach((value: GetPriceResult) => {
      if (value.price > maxExchanger.price) {
        maxExchanger.price = value.price;
        maxExchanger.provider = value.provider;
      }
      if (value.price < minExchanger.price) {
        minExchanger.price = value.price;
        minExchanger.provider = value.provider;
      }
    });

    const maxShift = maxExchanger.price - minExchanger.price;
    const profitPercentage = ((maxExchanger.price / minExchanger.price) - 1) * 100;

    return {
      isValid: profitPercentage >= opportunityThreshold,
      shift: maxShift,
      profitPercentage: profitPercentage,
      potentialSellExchange: maxExchanger.provider,
      potentialBuyExchange: minExchanger.provider
    };
  }

}