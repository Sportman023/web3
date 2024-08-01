import 'dotenv/config';
import { UniswapService } from './dex';
import { OkxService, BinanceService } from './cex';
import { CSVBuilder } from './report/csvBuilder';
import { TelegramBot } from './transport/telegram';
import config from 'config';

interface getPriceResult {
    provider: string;
    pair: string;
    price: number;
}

class Main {
    private readonly bot: TelegramBot;
    private readonly reportBuilder: CSVBuilder;
    private reportRecords: any[] = [];
    private appConfig: any;

    constructor() {
        this.bot = new TelegramBot();
        this.reportBuilder = new CSVBuilder();
        this.appConfig = config.get('application');
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
        }, 1000 * 60 * 60 * 4);
    }

    public startTrackPairs() {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const pairsToMonitor = this.appConfig.pairsToMonitor;

            for (const pair of pairsToMonitor) {
                const promises: Promise<any>[] = [];
                promises.push(this.uniswap(pair));
                promises.push(this.binance(pair));
                promises.push(this.okx(pair));
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
            }

            console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
        }, 1000 * 60 * 3);
    }

    private async uniswap(pair: string): Promise<getPriceResult> {
        const uniswapConfig: any = config.get('exchanges.uniswap');
        const pairConfig: any = uniswapConfig[pair];
        const netName: string = this.appConfig.get('netByPair')[pair];
        const netUrlName: string = this.appConfig.get('urlByNet')[netName];
        const uniswapService: UniswapService = new UniswapService(netName, netUrlName, pairConfig);

        const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
        const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Uniswap');
        console.log({ result });

        return result;
    }

    private async binance(pair: string): Promise<getPriceResult> {
        const binanceConfig: any = config.get('exchanges.binance');
        const pairConfig: any = binanceConfig[pair];

        const binanceService: BinanceService = new BinanceService(binanceConfig, pair);
        const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Binance');
    }

    public async okx(pair: string): Promise<getPriceResult> {
        const okxConfig: any = config.get('exchanges.okx');
        const pairConfig: any = okxConfig[pair];

        const okxService = new OkxService(okxConfig, pair);
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
        let maxPrice = ethUsdtValues[0];
        let minPrice = ethUsdtValues[0];

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
