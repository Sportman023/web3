import 'dotenv/config';
import config from 'config';
import { UniswapService } from './dex';
import { OkxService, BinanceService } from './cex';
import { CSVBuilder } from './report/csvBuilder';
import { TelegramBot } from './transport/telegram';

interface getPriceResult {
    provider: string;
    pair: string;
    price: number;
}

class Main {
    private readonly bot: TelegramBot;
    private readonly reportBuilder: CSVBuilder;
    private reportRecords: any[] = [];

    constructor() {
        this.bot = new TelegramBot();
        this.reportBuilder = new CSVBuilder();
    }

    public bootstrap(): void {
        try {
            this.startTrackPairs();
            this.startReporting();
        } catch (e) {
            console.log(e);
        }
    }

    public startReporting() {
        const chatIds = process.env.TELEGRAM_CHAT_IDS as string;
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
        }, 1000 * 60 * 60 * 8);
    }

    public startTrackPairs() {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const promises: Promise<any>[] = [];
            promises.push(this.uniswap());
            promises.push(this.binance());
            promises.push(this.okx());
            const [UNISWAP, BINANCE, OKX] = await Promise.all(promises);
            const ethUsdtValues = [UNISWAP['price'], BINANCE['price'], OKX['price']];
            const valid = this.validateOpportunity(ethUsdtValues, 5);
            if (valid.isValid) {
                this.reportRecords.push({
                    results: [UNISWAP, BINANCE, OKX],
                    maxShift: valid.maxShift,
                    currentTime: new Date().toISOString(),
                });
            }

            console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
        }, 1000 * 60 * 3);
    }

    private async uniswap(): Promise<getPriceResult> {
        const pairConfig: any = config.get('uniswap.ethUsdt');
        const uniswapService: UniswapService = new UniswapService(pairConfig);

        const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
        const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Uniswap');
        console.log({ result });

        return result;
    }

    private async binance(): Promise<getPriceResult> {
        const binanceConfig: any = config.get('binance');
        const pairConfig: any = binanceConfig.get('ethUsdt');

        const binanceService: BinanceService = new BinanceService(binanceConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
        const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Binance');
        console.log({ result });

        return result;
    }

    private async okx(): Promise<getPriceResult> {
        const okxConfig: any = config.get('okx');
        const pairConfig: any = config.get('okx.ethUsdt');

        const okxService = new OkxService(okxConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
        const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'OKX');
        console.log({ result });

        return result;
    }

    private formatGetPriceResult(pairConfig: any, buyOneOfToken0: number, provider: string): getPriceResult {
        const token0Symbol: string = pairConfig.get('token0Symbol');
        return { provider, pair: token0Symbol, price: buyOneOfToken0 };
    }

    private validateOpportunity(ethUsdtValues: number[], opportunityValue: number = 10) {
        let maxPrice = 0;
        let minPrice = 0;

        ethUsdtValues.forEach((value) => {
            if (value > maxPrice) {
                maxPrice = value;
            }
            if (value < minPrice) {
                minPrice = value;
            }
        });

        const maxShift = maxPrice - minPrice;

        return {
            isValid: maxShift > opportunityValue,
            maxShift: maxShift,
        };
    }
}

new Main().bootstrap();
