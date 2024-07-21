import { ethers, formatUnits } from 'ethers';
const INFURA_URL_MAINNET = process.env.INFURA_URL_MAINNET as string;

export class UniswapService {
    private pairConfig: any;
    private provider: any;
    private contract: any;

    constructor(pairConfig: any) {
        this.pairConfig = pairConfig;
        this.setupContract();
    }

    public async getPrice(): Promise<{
        buyOneOfToken0: number;
        buyOneOfToken1: number;
    }> {
        await this.getGasPrice();
        const slot0 = await this.contract.slot0();
        const sqrtPriceX96 = Number(slot0.sqrtPriceX96);

        const { token0Decimals, token1Decimals } = this.pairConfig;

        const buyOneOfToken0 =
            (Number(sqrtPriceX96) / 2 ** 96) ** 2 /
            Number(10 ** token0Decimals / 10 ** token1Decimals);

        const buyOneOfToken1 = Number(
            (1 / buyOneOfToken0).toFixed(token0Decimals)
        );

        return { buyOneOfToken0, buyOneOfToken1 };
    }

    public async getGasPrice(): Promise<number> {
        const feeData = await this.provider.getFeeData();
        // console.log('gasPrice: ', feeData);

        if (feeData.maxFeePerGas !== null) {
            console.log(
                '\tmaxFeePerGas',
                Number(formatUnits(feeData.maxFeePerGas, 'gwei'))
            );
        } else {
            console.log('maxFeePerGas is null');
        }

        if (feeData.gasPrice !== null) {
            console.log(
                '\tgasPrice',
                Number(formatUnits(feeData.gasPrice, 'gwei'))
            );
        } else {
            console.log('gasPrice is null');
        }

        return Number(formatUnits(feeData.gasPrice, 'gwei'));
    }

    private async setupContract(): Promise<void> {
        this.provider = new ethers.JsonRpcProvider(INFURA_URL_MAINNET);
        this.contract = new ethers.Contract(
            this.pairConfig.get('contractAddress'),
            this.pairConfig.get('abi'),
            this.provider
        );
    }
}
