import 'dotenv/config';
import { DeDustService, UniswapService } from './dex';
import { OkxService, BinanceService } from './cex';
import config from 'config';

class Main {
    public bootstrap(): void {
        this.startTrackPairs();
    }

    public async startTrackPairs(): Promise<void> {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const promises: Promise<any>[] = [];
            promises.push(this.uniswap());
            promises.push(this.binance());
            promises.push(this.okx());
            await Promise.all(promises);

            // this.dedust();

            console.log(
                '────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n'
            );
        }, 5000);
    }

    private async uniswap() {
        const pairConfig: any = config.get('uniswap.ethUsdt');
        const uniswapService: UniswapService = new UniswapService(pairConfig);

        const { buyOneOfToken0, buyOneOfToken1 } =
            await uniswapService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Uniswap');
    }

    private dedust() {
        const dedust = new DeDustService();
        dedust.startTrackPairs();
    }

    private async binance() {
        const binanceConfig: any = config.get('binance');
        const pairConfig: any = binanceConfig.get('ethUsdt');

        const binanceService: BinanceService = new BinanceService(
            binanceConfig,
            'ethUsdt'
        );
        const { buyOneOfToken0, buyOneOfToken1 } =
            await binanceService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Binance');
    }

    public async okx() {
        const okxConfig: any = config.get('okx');
        const pairConfig: any = config.get('okx.ethUsdt');

        const okxService = new OkxService(okxConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
        this.printPrice(pairConfig, buyOneOfToken0, buyOneOfToken1, 'OKX');
    }

    private printPrice(
        pairConfig: any,
        buyOneOfToken0: number,
        buyOneOfToken1: number,
        provider: string
    ) {
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
