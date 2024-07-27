"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = __importDefault(require("config"));
const dex_1 = require("./dex");
const cex_1 = require("./cex");
const csvBuilder_1 = require("./report/csvBuilder");
const telegram_1 = require("./transport/telegram");
class Main {
    bot;
    reportBuilder;
    reportRecords = [];
    constructor() {
        this.bot = new telegram_1.TelegramBot();
        this.reportBuilder = new csvBuilder_1.CSVBuilder();
    }
    bootstrap() {
        try {
            this.startTrackPairs();
            this.startReporting();
        }
        catch (e) {
            console.log(e);
        }
    }
    startReporting() {
        const chatIds = process.env.TELEGRAM_CHAT_IDS;
        const ids = chatIds.split(',');
        setInterval(async () => {
            if (!this.reportRecords.length) {
                ids.forEach(async (chatId) => {
                    await this.bot.sendMessage(chatId, '🗑️ No opportunities to arbitration.');
                });
                return;
            }
            const csv = this.reportBuilder.prepareDocument(this.reportRecords);
            ids.forEach(async (chatId) => {
                await this.bot.sendDocument(chatId, csv);
            });
            this.reportRecords = [];
        }, 1000 * 30);
    }
    startTrackPairs() {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const promises = [];
            promises.push(this.uniswap());
            promises.push(this.binance());
            promises.push(this.okx());
            const [UNISWAP, BINANCE, OKX] = await Promise.all(promises);
            const ethUsdtValues = [UNISWAP['ETH-USDT'], BINANCE['ETH-USDT'], OKX['ETH-USDT']];
            const valid = this.validateOpportunity(ethUsdtValues, 1);
            if (valid.isValid) {
                this.reportRecords.push({
                    pairs: { UNISWAP, BINANCE, OKX },
                    maxShift: valid.maxShift
                });
            }
            console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
        }, 5000);
    }
    async uniswap() {
        const pairConfig = config_1.default.get('uniswap.ethUsdt');
        const uniswapService = new dex_1.UniswapService(pairConfig);
        const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
        const result = this.formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Uniswap');
        console.log(`${result.provider}: `, { ...result.tokenPrices });
        return result.tokenPrices;
    }
    async binance() {
        const binanceConfig = config_1.default.get('binance');
        const pairConfig = binanceConfig.get('ethUsdt');
        const binanceService = new cex_1.BinanceService(binanceConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
        const result = this.formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Binance');
        console.log(`${result.provider}: `, { ...result.tokenPrices });
        return result.tokenPrices;
    }
    async okx() {
        const okxConfig = config_1.default.get('okx');
        const pairConfig = config_1.default.get('okx.ethUsdt');
        const okxService = new cex_1.OkxService(okxConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
        const result = this.formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, 'OKX');
        console.log(`${result.provider}: `, { ...result.tokenPrices });
        return result.tokenPrices;
    }
    formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, provider) {
        const token0Symbol = pairConfig.get('token0Symbol');
        const token1Symbol = pairConfig.get('token1Symbol');
        let tokenPrices = {
            [token0Symbol]: buyOneOfToken0,
            [token1Symbol]: buyOneOfToken1,
        };
        return { provider, tokenPrices };
    }
    validateOpportunity(ethUsdtValues, opportunityValue = 10) {
        let maxShift = 0;
        for (let i = 0; i < ethUsdtValues.length; i++) {
            for (let j = i + 1; j < ethUsdtValues.length; j++) {
                const shift = Math.abs(ethUsdtValues[i] - ethUsdtValues[j]);
                maxShift = Math.max(maxShift, shift);
            }
        }
        return {
            isValid: maxShift > opportunityValue,
            maxShift: maxShift
        };
    }
}
new Main().bootstrap();
