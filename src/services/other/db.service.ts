import { ArbitrageOpportunity, Prisma } from '@prisma/client';
import { ArbitrageOpportunityRepository, TradingPairRepository } from '../../repositories';

export class DBService {
  constructor(private arbitrageOpportunityRepo: ArbitrageOpportunityRepository, private tradingPairRepo: TradingPairRepository) {}

  async findArbitrageOpportunities() {
    return this.arbitrageOpportunityRepo.findRecordsForReport();
  }

  async findActiveTradingPairs() {
    return this.tradingPairRepo.findActivePairs();
  }

  async createArbitrageOpportunity(data: Record<string, any>): Promise<ArbitrageOpportunity> {
    const opportunityItem: Prisma.ArbitrageOpportunityCreateInput = {
      timestamp: data.currentTime,
      profitPercentage: data.profitPercentage,
      tradingPairName: data.pair,
      volume: 1,
      status: 'identified',
      buyExchange: {
        connect: { id: data.potentialBuyExchangeId }
      },
      sellExchange: {
        connect: { id: data.potentialSellExchangeId }
      }
    }
    return this.arbitrageOpportunityRepo.create(opportunityItem);
  }
}
