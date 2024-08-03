import { ArbitrageOpportunity, Prisma } from '@prisma/client';
import { ArbitrageOpportunityRepository, ExchangeRepository } from '../repositories';

export class ArbitrageOpportunityService {
  constructor(
    private arbitrageOpportunityRepo: ArbitrageOpportunityRepository,
    private exchangeRepo: ExchangeRepository
  ) {}

  async createArbitrageOpportunity(data: Record<string, any>): Promise<ArbitrageOpportunity> {
    const potentialSellExchange = await this.exchangeRepo.findByName(data.potentialSellExchange);
    const potentialBuyExchange = await this.exchangeRepo.findByName(data.potentialBuyExchange);

    const opportunityItem: Prisma.ArbitrageOpportunityCreateInput = {
      timestamp: data.currentTime,
      profitPercentage: data.maxShift,
      buyExchange: {
        connect: { id: potentialBuyExchange?.id }
      },
      sellExchange: {
        connect: { id: potentialSellExchange?.id }
      },
      tradingPair: {
        connect: undefined // TODO: add pair
      },
      volume: 100
    }
    return this.arbitrageOpportunityRepo.create(opportunityItem);
  }
}
