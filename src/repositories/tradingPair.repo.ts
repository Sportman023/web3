import { PrismaClient } from '@prisma/client';

export class TradingPairRepository {
  constructor(private prisma: PrismaClient) {}

  async findActivePairs() {
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

    return tradingPairs;
  }
}
