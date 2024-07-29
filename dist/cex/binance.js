"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceService = void 0;
class BinanceService {
    binanceConfig;
    pair;
    constructor(binanceConfig, pair) {
        this.binanceConfig = binanceConfig;
        this.pair = pair;
    }
    async getPrice() {
        const baseUrl = this.binanceConfig.get('baseUrl');
        const getPricePath = this.binanceConfig.get('getPricePath');
        const pairConfig = this.binanceConfig.get(this.pair);
        const url = `${baseUrl}${getPricePath}?symbol=${pairConfig.get('symbol')}`;
        let buyOneOfToken0 = 0;
        let buyOneOfToken1 = 0;
        try {
            const response = await fetch(url);
            const body = await response.json();
            buyOneOfToken0 = Number(body.price);
            buyOneOfToken1 = 1 / body.price;
        }
        catch (error) {
            console.error('Error fetching the ETH/USDT rate:', error);
        }
        return { buyOneOfToken0, buyOneOfToken1 };
    }
}
exports.BinanceService = BinanceService;
