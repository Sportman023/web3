import { TradingPair, Prisma } from '@prisma/client';
import { TradingPairRepository } from '../repositories';

export default class TradingPairService {
  constructor(private tradingRepository: TradingPairRepository) {}

  async createTradingPair(data: Prisma.TradingPairCreateInput): Promise<TradingPair> {
    return this.tradingRepository.create(data);
  }
}