import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import { exchangeRoutes } from './routes/exchange.route';
import { initPlugin, prismaPlugin, telegramPlugin, zodPlugin } from './plugins';
import envToLogger from './utils/logger.util';

const port = Number(process.env.PORT) || 3000;
const environment = String(process.env.NODE_ENV);
const server: FastifyInstance = Fastify({ logger: envToLogger(environment) || true });

server.register(telegramPlugin);
server.register(prismaPlugin);
server.register(initPlugin);
server.register(zodPlugin);
server.register(exchangeRoutes, { prefix: '/api/exchanges' });

const start = async () => {
  try {
    await server.ready();
    await server.listen({ port });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
