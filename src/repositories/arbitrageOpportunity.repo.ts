import { PrismaClient, ArbitrageOpportunity, Prisma } from '@prisma/client';
import { get4HAgoDateTime } from '../utils/main.util';

export class ArbitrageOpportunityRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.ArbitrageOpportunityCreateInput): Promise<ArbitrageOpportunity> {
    return this.prisma.arbitrageOpportunity.create({ data });
  }

  async update(id: number, data: Prisma.ArbitrageOpportunityUpdateInput): Promise<ArbitrageOpportunity> {
    return this.prisma.arbitrageOpportunity.update({ where: { id }, data });
  }

  async findAll() {
    return this.prisma.arbitrageOpportunity.findMany();
  }

  async findRecordsForReport() {
    const dbResult = await this.prisma.arbitrageOpportunity.findMany({
      where: {
        timestamp: {
          gte: get4HAgoDateTime()
        }
      },
      select: {
        timestamp: true,
        tradingPairName: true,
        profitPercentage: true,
        volume: true,
        status: true,
        buyExchange: {
          select: {
            name: true
          }
        },
        sellExchange: {
          select: {
            name: true
          }
        }
      }
    });

    return dbResult.map(item => {
      return {
        ...item,
        buyExchange: item.buyExchange.name,
        sellExchange: item.sellExchange.name
      }
    })
  }
}
