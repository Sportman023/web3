import 'dotenv/config';
import { DeDustService, UniswapService } from './dex';
import { OkxService, BinanceService } from './cex';
import config from 'config';

class Main {
    private appConfig: any;

    public bootstrap(): void {
        this.appConfig = config.get('application');
        this.startTrackPairs();
    }

    public async startTrackPairs(): Promise<void> {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const pairsToMonitor = this.appConfig.pairsToMonitor;

            for (const pair of pairsToMonitor) {
                const promises: Promise<any>[] = [];
                promises.push(this.uniswap(pair));
                promises.push(this.binance(pair));
                promises.push(this.okx(pair));
                await Promise.all(promises);

                // this.dedust();

                console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
            }
        }, 1000 * 5);
    }

    private async uniswap(pair: string) {
        const uniswapConfig: any = config.get('exchanges.uniswap');
        const pairConfig: any = uniswapConfig[pair];
        const netName: string = this.appConfig.get('netByPair')[pair];
        const netUrlName: string = this.appConfig.get('urlByNet')[netName];
        const uniswapService: UniswapService = new UniswapService(netName, netUrlName, pairConfig);

        const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Uniswap');
    }

    private dedust() {
        const dedust = new DeDustService();
        dedust.startTrackPairs();
    }

    private async binance(pair: string) {
        const binanceConfig: any = config.get('exchanges.binance');
        const pairConfig: any = binanceConfig[pair];

        const binanceService: BinanceService = new BinanceService(binanceConfig, pair);
        const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Binance');
    }

    public async okx(pair: string) {
        const okxConfig: any = config.get('exchanges.okx');
        const pairConfig: any = okxConfig[pair];

        const okxService = new OkxService(okxConfig, pair);
        const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'OKX');
    }

    private printPrice(pairConfig: any, buyOneOfToken0: number, buyOneOfToken1: number, provider: string) {
        const token0Symbol: string = pairConfig.get('token0Symbol');
        const token1Symbol: string = pairConfig.get('token1Symbol');

        let result: any = {
            [token0Symbol]: buyOneOfToken0,
            [token1Symbol]: buyOneOfToken1,
        };

        console.log(`${provider}: `, { ...result });
    }
}

new Main().bootstrap();
