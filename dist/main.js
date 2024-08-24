"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = __importDefault(require("config"));
const app_1 = require("./app");
const services_1 = require("./services");
const services_2 = require("./services");
const client_1 = require("@prisma/client");
const services_3 = require("./services");
const environment = String(process.env.NODE_ENV);
console.log({ environment });
(function start() {
    const telegram = new services_1.TelegramClient();
    const csv = new services_2.CSVService();
    const prisma = new client_1.PrismaClient();
    const exchange = new services_3.ExchangeService();
    new app_1.App(telegram, csv, prisma, exchange, config_1.default).bootstrap();
})();
//# sourceMappingURL=main.js.map