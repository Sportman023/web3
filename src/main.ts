import { DeDustService } from './ton';
import { UniswapService } from './evm/uniswap';
import { OkxService } from './evm/okx';
import config from 'config';

class Main {
    public bootstrap() {
        // this.dedust();
        // this.uniswap();
        this.okx();
    }

    public uniswap() {
        const uniswapConfig: any = config.get('uniswap');
        const ethUsdtConfig: any = uniswapConfig.get('eth_usdt');

        const uniswap = new UniswapService(ethUsdtConfig);

        uniswap.startTrackPairs();
    }

    public dedust() {
        const dedust = new DeDustService();
        dedust.startTrackPairs();
    }

    public okx() {
        const okx = new OkxService();
        okx.getPrice();
    }
}

new Main().bootstrap();
