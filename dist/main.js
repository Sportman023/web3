"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const exchange_route_1 = require("./routes/exchange.route");
const plugins_1 = require("./plugins");
const logger_util_1 = __importDefault(require("./utils/logger.util"));
const port = Number(process.env.PORT) || 3000;
const environment = String(process.env.NODE_ENV);
const server = (0, fastify_1.default)({ logger: (0, logger_util_1.default)(environment) || true });
server.register(plugins_1.telegramPlugin);
server.register(plugins_1.prismaPlugin);
server.register(plugins_1.initPlugin);
server.register(plugins_1.zodPlugin);
server.register(exchange_route_1.exchangeRoutes, { prefix: '/api/exchanges' });
const start = async () => {
    try {
        await server.ready();
        await server.listen({ port });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
