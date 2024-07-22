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
        const transactionGasFee: number = await this.getGasPrice();
        const slot0 = await this.contract.slot0();
        const sqrtPriceX96 = Number(slot0.sqrtPriceX96);

        const { token0Decimals, token1Decimals } = this.pairConfig;

        const buyOneOfToken0 =
            (Number(sqrtPriceX96) / 2 ** 96) ** 2 /
            Number(10 ** token0Decimals / 10 ** token1Decimals);

        const buyOneOfToken1 = Number(
            (1 / buyOneOfToken0).toFixed(token0Decimals)
        );

        console.log('\tSwap cost: ', transactionGasFee * buyOneOfToken0);

        const buyOneOfToken0WithFee =
            buyOneOfToken0 + transactionGasFee * buyOneOfToken0;
        const buyOneOfToken1WithFee = buyOneOfToken1 + transactionGasFee;

        console.log({ buyOneOfToken0WithFee, buyOneOfToken1WithFee });

        return { buyOneOfToken0, buyOneOfToken1 };
    }

    public async getGasPrice(): Promise<number> {
        const feeData = await this.provider.getFeeData();

        let transactionGasFee: number = 0;
        if (
            feeData.gasPrice !== null &&
            feeData.maxPriorityFeePerGas !== null
        ) {
            const gasPrice: number = Number(
                formatUnits(feeData.gasPrice, 'ether')
            );

            const maxPriorityFeePerGas: number = Number(
                formatUnits(feeData.maxPriorityFeePerGas, 'ether')
            );

            const swapGasLimit: number = 356190; // NOTE: Based on etherscan.io/gastracker
            transactionGasFee =
                (gasPrice + maxPriorityFeePerGas) * swapGasLimit;
        } else {
            console.log('null');
        }

        return transactionGasFee;
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
