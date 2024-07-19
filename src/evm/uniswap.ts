import 'dotenv/config';
import { ethers } from 'ethers';

const INFURA_URL_MAINNET = process.env.INFURA_URL_MAINNET as string;

export class UniswapService {
    private ethUsdtConfig: any;
    private contract: any;

    constructor(ethUsdtConfig: any) {
        this.ethUsdtConfig = ethUsdtConfig;
        this.setupContract();
    }

    public async getPrice(): Promise<{
        buyOneOfToken0: number;
        buyOneOfToken1: number;
    }> {
        const slot0 = await this.contract.slot0();
        const sqrtPriceX96 = Number(slot0.sqrtPriceX96);

        const token0Decimals = this.ethUsdtConfig.get('token0Decimals');
        const token1Decimals = this.ethUsdtConfig.get('token1Decimals');

        const buyOneOfToken0 =
            (Number(sqrtPriceX96) / 2 ** 96) ** 2 /
            Number(10 ** token0Decimals / 10 ** token1Decimals);

        const buyOneOfToken1 = Number(
            (1 / buyOneOfToken0).toFixed(token0Decimals)
        );

        return { buyOneOfToken0, buyOneOfToken1 };
    }

    private async setupContract(): Promise<void> {
        const provider = new ethers.JsonRpcProvider(INFURA_URL_MAINNET);
        this.contract = new ethers.Contract(
            this.ethUsdtConfig.get('contractAddress'),
            this.ethUsdtConfig.get('abi'),
            provider
        );
    }

    public startTrackPairs() {
        setInterval(async () => {
            const { buyOneOfToken0, buyOneOfToken1 } = await this.getPrice();
            const token0Symbol = this.ethUsdtConfig.get(
                'token0Symbol'
            ) as string;
            const token1Symbol = this.ethUsdtConfig.get(
                'token1Symbol'
            ) as string;

            let result: any = {
                [token0Symbol]: buyOneOfToken0,
                [token1Symbol]: buyOneOfToken1,
            };

            console.log({ ...result });
            console.log('------------------------\n');
        }, 5000);
    }
}
