import { Exchange, Prisma } from '@prisma/client';
import { ExchangeRepository } from '../repositories';

export class ExchangeService {
  constructor(private exchangeRepository: ExchangeRepository) {}

  async createExchange(data: Prisma.ExchangeCreateInput): Promise<Exchange> {
    return this.exchangeRepository.create(data);
  }

  async getAllExchanges(): Promise<Exchange[]> {
    return this.exchangeRepository.findAll();
  }

  async getExchangeById(id: number): Promise<Exchange | null> {
    return this.exchangeRepository.findById(id);
  }

  async updateExchange(id: number, data: Prisma.ExchangeUpdateInput): Promise<Exchange> {
    return this.exchangeRepository.update(id, data);
  }

  async deleteExchange(id: number): Promise<Exchange> {
    return this.exchangeRepository.delete(id);
  }
}
