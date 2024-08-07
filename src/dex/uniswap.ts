import { ethers, formatUnits } from 'ethers';
// import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import SwapRouterABI from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json'; //TODO: to replace by abi json file
import ERC20ABI from '../../config/erc20abi.json';

const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as string;

const UniversalRouterV1_2 = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'; //sepolia

const universalRouterContractAddress = '0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B';

export class UniswapService {
    private netUrl: string;
    private netName: string;
    private pairConfig: any;
    private poolContract: ethers.Contract;
    private provider: ethers.JsonRpcProvider;
    private swapRouterContract: ethers.Contract;

    constructor(netName: string, netUrlName: string, pairConfig: any) {
        this.netName = netName;
        this.netUrl = process.env[netUrlName] as string;

        this.pairConfig = pairConfig;

        this.provider = new ethers.JsonRpcProvider(this.netUrl);
        this.poolContract = new ethers.Contract(this.pairConfig.get('contractAddress')[this.netName], this.pairConfig.get('abi'), this.provider);
        this.swapRouterContract = new ethers.Contract(universalRouterContractAddress, SwapRouterABI.abi, this.provider);
    }

    public async getPrice(): Promise<{
        buyOneOfToken0: number;
        buyOneOfToken1: number;
    }> {
        const transactionGasFee: number = await this.getGasPrice();
        const slot0 = await this.poolContract.slot0();
        const sqrtPriceX96 = Number(slot0.sqrtPriceX96);

        const { token0Decimals, token1Decimals } = this.pairConfig;

        const buyOneOfToken0 = (Number(sqrtPriceX96) / 2 ** 96) ** 2 / Number(10 ** token0Decimals / 10 ** token1Decimals);

        const buyOneOfToken1 = Number((1 / buyOneOfToken0).toFixed(token0Decimals));

        // console.log('\tSwap cost: ', transactionGasFee * buyOneOfToken0);

        const buyOneOfToken0WithFee = buyOneOfToken0 + transactionGasFee * buyOneOfToken0;
        const buyOneOfToken1WithFee = buyOneOfToken1 + transactionGasFee;

        // console.log({ buyOneOfToken0WithFee, buyOneOfToken1WithFee });

        return { buyOneOfToken0, buyOneOfToken1 };
    }

    public async getGasPrice(): Promise<number> {
        const feeData = await this.provider.getFeeData();

        // console.log({ feeData });

        if (feeData.gasPrice === null || feeData.maxPriorityFeePerGas == null) {
            return 0;
        }

        const gasPrice: number = Number(formatUnits(feeData.gasPrice, 'ether'));
        const maxPriorityFeePerGas: number = Number(formatUnits(feeData.maxPriorityFeePerGas, 'ether'));

        const swapGasLimit: number = 356190; // NOTE: Based on etherscan.io/gastracker
        return (gasPrice + maxPriorityFeePerGas) * swapGasLimit;
    }

    public async swapToken(token0AmountDec: number, token1AmountDec: number, isToken0: boolean): Promise<void> {
        const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, this.provider);
        const connectedWallet = wallet.connect(this.provider);

        const [token0, token1, fee] = await Promise.all([this.poolContract.token0(), this.poolContract.token1(), this.poolContract.fee()]);

        const { token0Decimals, token1Decimals } = this.pairConfig;

        const token0Amount = ethers.parseUnits(token0AmountDec.toString(), token0Decimals);
        const token1Amount = ethers.parseUnits(token1AmountDec.toString(), token0Decimals);

        const amountIn = isToken0 ? token0Amount : token1Amount;
        const amountOut = isToken0 ? token1Amount : token0Amount;

        const tokenIn = isToken0 ? token1 : token0;
        const tokenOut = isToken0 ? token0 : token1;

        const approvalAmount = amountIn;

        const tokenContract = new ethers.Contract(token0, ERC20ABI, connectedWallet);

        const allowance = await tokenContract.allowance(WALLET_ADDRESS, universalRouterContractAddress);

        if (allowance.lt(approvalAmount)) {
            const approveTx = await tokenContract.approve(universalRouterContractAddress, approvalAmount);
            console.log({ approveTx });
        }

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

        const tx = await this.swapRouterContract.exactInputSingle(
            {
                tokenIn,
                tokenOut,
                fee,
                recipient: WALLET_ADDRESS,
                deadline,
                amountIn,
                amountOutMinimum: amountOut,
                sqrtPriceLimitX96: 0,
            },
            { gasLimit: 1000000, gasPrice: 1000000000 } //TODO: to replace by gas limit and gas price
        );

        console.log({ tx });
    }
}
