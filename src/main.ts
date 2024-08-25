import 'dotenv/config';
import config from 'config';
import { App } from './app';
import { TelegramClient } from './services';
import { CSVService } from './services';
import { PrismaClient } from '@prisma/client';
import { ExchangeService } from './services';

(function start() {
  const telegram = new TelegramClient();
  const csv = new CSVService();
  const prisma = new PrismaClient();
  const exchange = new ExchangeService();
  new App(telegram, csv, prisma, exchange, config).bootstrap().finally(() => console.log('\u001b[37;42m', 'application started', '\x1b[0m'));
})();
