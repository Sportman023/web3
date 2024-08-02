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

interface interval {
    hours: number;
    minutes: number;
    seconds: number;
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
        console.log('⭐ application has been started...');
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
        const reportingInterval = this.getMillisecondsFromInterval(this.appConfig.get('reportingInterval'));
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
        }, reportingInterval);
    }

    public startTrackPairs() {
        const priceTrackingInterval = this.getMillisecondsFromInterval(this.appConfig.get('priceTrackingInterval'));

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
                const valid = this.validateOpportunity(ethUsdtValues);

                console.log({ pair, ethUsdtValues, valid });

                if (valid.isValid) {
                    this.reportRecords.push({
                        results: [UNISWAP, BINANCE, OKX],
                        maxShift: valid.maxShift,
                        currentTime: new Date().toISOString(),
                    });
                }
            }

            console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
        }, priceTrackingInterval);
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
        const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Binance');
        console.log({ result });

        return result;
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

    private getMillisecondsFromInterval(interval: interval): number {
        return interval.hours * 60 * 60 * 1000 + interval.minutes * 60 * 1000 + interval.seconds * 1000;
    }

    private validateOpportunity(ethUsdtValues: number[]) {
        const opportunityThreshold = this.appConfig.get('opportunityThreshold');

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
        const priceDifference = maxPrice / minPrice - 1;
        console.log({ priceDifference });

        return {
            isValid: priceDifference >= opportunityThreshold,
            maxShift: maxShift,
        };
    }
}

new Main().bootstrap();
