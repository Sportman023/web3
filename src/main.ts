import { DeDustService } from './ton';
import { UniswapService } from './evm/uniswap';
import { OkxService } from './evm/okx';
import { BinanceService } from './evm/binance';
import config from 'config';

class Main {
    public bootstrap(): void {
        this.startTrackPairs();
    }

    public startTrackPairs(): void {
        setInterval(async () => {
            console.log(new Date().toISOString());
            const promises: Promise<any>[] = [];
            promises.push(this.uniswap());
            promises.push(this.binance());
            await Promise.all(promises);

            // this.dedust();
            // this.okx();

            console.log('------------------------\n');
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

    public okx() {
        const okx = new OkxService();
        okx.getPrice();
    }
}

new Main().bootstrap();
