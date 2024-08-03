import { ArbitrageOpportunity, Prisma } from '@prisma/client';
import { ArbitrageOpportunityRepository } from '../repositories';

export class ArbitrageOpportunityService {
  constructor(private arbitrageOpportunityRepo: ArbitrageOpportunityRepository) {}

  async createArbitrageOpportunity(data: Prisma.ArbitrageOpportunityCreateInput): Promise<ArbitrageOpportunity> {
    return this.arbitrageOpportunityRepo.create(data);
  }
}
