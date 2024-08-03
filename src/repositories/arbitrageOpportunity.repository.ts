import { ArbitrageOpportunity, PrismaClient } from '@prisma/client';
import { CreateArbitrageOpportunityDto } from '../types';

export class ArbitrageOpportunityRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: any): Promise<ArbitrageOpportunity> {
    return this.prisma.arbitrageOpportunity.create({ data });
  }


}
