import 'dotenv/config';
import config from 'config';
import { App } from './app';
import { TelegramClient } from './services';
import { CSVService } from './services';
import { PrismaClient } from '@prisma/client';
import { ExchangeService } from './services';

const environment = String(process.env.NODE_ENV);

console.log({environment});

(function start() {
  const telegram = new TelegramClient();
  const csv = new CSVService();
  const prisma = new PrismaClient();
  const exchange = new ExchangeService();
  new App(telegram, csv, prisma, exchange, config).bootstrap();
})();
