import { PrismaClient, TradingPair, Prisma } from '@prisma/client';

export class TradingPairRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.TradingPairCreateInput): Promise<TradingPair> {
    return this.prisma.tradingPair.create({ data });
  }
}