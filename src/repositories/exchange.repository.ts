import { PrismaClient, Exchange, Prisma } from '@prisma/client';

export class ExchangeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.ExchangeCreateInput): Promise<Exchange> {
    return this.prisma.exchange.create({ data });
  }

  async findAll(): Promise<Exchange[]> {
    return this.prisma.exchange.findMany();
  }

  async findById(id: number): Promise<Exchange | null> {
    return this.prisma.exchange.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Exchange | null> {
    return this.prisma.exchange.findUnique({ where: { name } });
  }

  async update(id: number, data: Prisma.ExchangeUpdateInput): Promise<Exchange> {
    return this.prisma.exchange.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Exchange> {
    return this.prisma.exchange.delete({ where: { id } });
  }
}
