import { ArbitrageOpportunity, Prisma } from '@prisma/client';
import { ArbitrageOpportunityRepository } from '../repositories';

export class ArbitrageOpportunityService {
  constructor(
    private arbitrageOpportunityRepo: ArbitrageOpportunityRepository
  ) {}

  async createArbitrageOpportunity(data: Record<string, any>): Promise<ArbitrageOpportunity> {
    const opportunityItem: Prisma.ArbitrageOpportunityCreateInput = {
      timestamp: data.currentTime,
      profitPercentage: data.maxShift, // TODO
      tradingPairName: data.pair,
      volume: 100,
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
