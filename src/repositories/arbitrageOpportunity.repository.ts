import { PrismaClient, ArbitrageOpportunity, Prisma } from '@prisma/client';

export class ArbitrageOpportunityRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.ArbitrageOpportunityCreateInput): Promise<ArbitrageOpportunity> {
    return this.prisma.arbitrageOpportunity.create({ data });
  }

  async update(id: number, data: Prisma.ArbitrageOpportunityUpdateInput): Promise<ArbitrageOpportunity> {
    return this.prisma.arbitrageOpportunity.update({ where: { id }, data });
  }
}
