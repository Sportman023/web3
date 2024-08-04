import { FastifyPluginAsync } from 'fastify';
import { Exchange } from '@prisma/client';
import { ExchangeService } from '../services';
import { ExchangeRepository } from '../repositories';
import {
  createExchangeSchema, updateExchangeSchema,
  CreateExchangeInput, UpdateExchangeInput
} from '../schemas/exchange.schema';

const exchangeRoutes: FastifyPluginAsync = async (fastify) => {
  const exchangeRepository = new ExchangeRepository(fastify.prisma);
  const exchangeService = new ExchangeService(exchangeRepository);

  fastify.post<{ Body: CreateExchangeInput, Reply: Exchange }>('/', {
    schema: {
      body: createExchangeSchema,
    },
  }, async (request, reply) => {
    const exchange = await exchangeService.createExchange(request.body);
    reply.code(201).send(exchange);
  });

  fastify.get<{ Reply: Exchange[] }>('/', async (request, reply) => {
    const exchanges = await exchangeService.getAllExchanges();
    reply.send(exchanges);
  });

  fastify.get<{ Params: { id: string }, Reply: Exchange | Record<string, string> }>('/:id', async (request, reply) => {
    const exchange = await exchangeService.getExchangeById(parseInt(request.params.id, 10));
    if (!exchange) {
      reply.code(404).send({ message: 'Exchange not found' });
    } else {
      reply.send(exchange);
    }
  });

  fastify.put<{ Params: { id: string }, Body: UpdateExchangeInput, Reply: Exchange }>('/:id', {
    schema: {
      body: updateExchangeSchema,
    },
  }, async (request, reply) => {
    console.log(request.body);
    const exchange = await exchangeService.updateExchange(parseInt(request.params.id, 10), request.body);
    reply.send(exchange);
  });

  fastify.delete<{ Params: { id: string }, Reply: Exchange }>('/:id', async (request, reply) => {
    const exchange = await exchangeService.deleteExchange(parseInt(request.params.id, 10));
    reply.send(exchange);
  });
};

export { exchangeRoutes };
