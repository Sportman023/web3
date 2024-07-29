"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniswapService = void 0;
const ethers_1 = require("ethers");
const INFURA_URL_MAINNET = process.env.INFURA_URL_MAINNET;
class UniswapService {
    pairConfig;
    provider;
    contract;
    constructor(pairConfig) {
        this.pairConfig = pairConfig;
        this.setupContract();
    }
    async getPrice() {
        const transactionGasFee = await this.getGasPrice();
        const slot0 = await this.contract.slot0();
        const sqrtPriceX96 = Number(slot0.sqrtPriceX96);
        const { token0Decimals, token1Decimals } = this.pairConfig;
        const buyOneOfToken0 = (Number(sqrtPriceX96) / 2 ** 96) ** 2 /
            Number(10 ** token0Decimals / 10 ** token1Decimals);
        const buyOneOfToken1 = Number((1 / buyOneOfToken0).toFixed(token0Decimals));
        // console.log('\tSwap cost: ', transactionGasFee * buyOneOfToken0);
        const buyOneOfToken0WithFee = buyOneOfToken0 + transactionGasFee * buyOneOfToken0;
        const buyOneOfToken1WithFee = buyOneOfToken1 + transactionGasFee;
        // console.log({ buyOneOfToken0WithFee, buyOneOfToken1WithFee });
        return { buyOneOfToken0, buyOneOfToken1 };
    }
    async getGasPrice() {
        const feeData = await this.provider.getFeeData();
        // console.log({feeData});
        if (feeData.gasPrice === null || feeData.maxPriorityFeePerGas == null) {
            return 0;
        }
        const gasPrice = Number((0, ethers_1.formatUnits)(feeData.gasPrice, 'ether'));
        const maxPriorityFeePerGas = Number((0, ethers_1.formatUnits)(feeData.maxPriorityFeePerGas, 'ether'));
        const swapGasLimit = 356190; // NOTE: Based on etherscan.io/gastracker
        return (gasPrice + maxPriorityFeePerGas) * swapGasLimit;
    }
    async setupContract() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(INFURA_URL_MAINNET);
        this.contract = new ethers_1.ethers.Contract(this.pairConfig.get('contractAddress'), this.pairConfig.get('abi'), this.provider);
    }
}
exports.UniswapService = UniswapService;
