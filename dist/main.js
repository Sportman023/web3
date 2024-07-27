"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const dex_1 = require("./dex");
const cex_1 = require("./cex");
const config_1 = __importDefault(require("config"));
class Main {
    bootstrap() {
        this.startTrackPairs();
    }
    async startTrackPairs() {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const promises = [];
            promises.push(this.uniswap());
            promises.push(this.binance());
            promises.push(this.okx());
            await Promise.all(promises);
            // this.dedust();
            console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
        }, 5000);
    }
    async uniswap() {
        const pairConfig = config_1.default.get('uniswap.ethUsdt');
        const uniswapService = new dex_1.UniswapService(pairConfig);
        const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Uniswap');
    }
    dedust() {
        const dedust = new dex_1.DeDustService();
        dedust.startTrackPairs();
    }
    async binance() {
        const binanceConfig = config_1.default.get('binance');
        const pairConfig = binanceConfig.get('ethUsdt');
        const binanceService = new cex_1.BinanceService(binanceConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Binance');
    }
    async okx() {
        const okxConfig = config_1.default.get('okx');
        const pairConfig = config_1.default.get('okx.ethUsdt');
        const okxService = new cex_1.OkxService(okxConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'OKX');
    }
    printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, provider) {
        const token0Symbol = pairConfig.get('token0Symbol');
        const token1Symbol = pairConfig.get('token1Symbol');
        let result = {
            [token0Symbol]: buyOneOfToken0,
            [token1Symbol]: buyOneOfToken1,
        };
        console.log(`${provider}: `, { ...result });
    }
}
new Main().bootstrap();
