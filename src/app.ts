import { CSVService, DBService, TelegramClient, SchedulerService, ExchangeService } from './services';
import { ArbitrageOpportunityRepository, TradingPairRepository } from './repositories';
import { PrismaClient } from '@prisma/client';

export class App {
  private dbService: DBService;

  constructor(
    private telegram: TelegramClient,
    private reportBuilder: CSVService,
    private prisma: PrismaClient,
    private exchange: ExchangeService,
    private config: any
  ) {
    this.dbService = new DBService(
      new ArbitrageOpportunityRepository(this.prisma),
      new TradingPairRepository(this.prisma)
    );
  }

  public async bootstrap(): Promise<void> {
    try {
      new SchedulerService(this.dbService, this.telegram, this.reportBuilder, this.exchange, this.config).start();
    } catch (e) {
      console.log(e);
    }
  }
}