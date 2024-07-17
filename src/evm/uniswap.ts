import 'dotenv/config';
import JSBI from 'jsbi';
import { TickMath, FullMath } from '@uniswap/v3-sdk';
import Web3 from 'web3';

const INFURA_URL_MAINNET = process.env.INFURA_URL_MAINNET as string;

interface Slot0 {
    sqrtPriceX96: string;
    tick: string;
}

export class UniswapPriceService {
    private web3: Web3;
    private contractAddress: string;
    private abi: any[];

    constructor(contractAddress: string, abi: any[]) {
        this.web3 = new Web3(INFURA_URL_MAINNET);
        this.contractAddress = contractAddress;
        this.abi = abi;
    }

    public async fetch(
        inputAmount: number,
        baseTokenDecimals: number,
        quoteTokenDecimals: number
    ): Promise<void> {
        const slot0 = await this.getUniswapV3UsdtSlot0();
        const currentTick = parseInt(slot0.tick);
        console.log('currentTick: ', currentTick);

        const sqrtRatioX96FromSqrtPriceX96 = JSBI.BigInt(
            slot0.sqrtPriceX96.toString()
        );
        const priceFromSqrtRatio = this.getPrice(
            sqrtRatioX96FromSqrtPriceX96,
            inputAmount,
            baseTokenDecimals,
            quoteTokenDecimals
        );
        console.log(
            'priceFromSqrtRatio: ',
            Number(priceFromSqrtRatio.toString()) / 10 ** quoteTokenDecimals
        );

        const sqrtRatioX96FromTick = TickMath.getSqrtRatioAtTick(currentTick);
        const priceFromTick = this.getPrice(
            sqrtRatioX96FromTick,
            inputAmount,
            baseTokenDecimals,
            quoteTokenDecimals
        );
        console.log(
            'priceFromTick: ',
            Number(priceFromTick.toString()) / 10 ** quoteTokenDecimals
        );
    }

    private getPrice(
        sqrtRatioX96: JSBI,
        inputAmount: number,
        baseTokenDecimals: number,
        quoteTokenDecimals: number
    ): JSBI {
        const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);
        const baseAmount = JSBI.BigInt(inputAmount * 10 ** baseTokenDecimals);

        const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));

        return FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift);
    }

    private async getUniswapV3UsdtSlot0(): Promise<Slot0> {
        const contract = new this.web3.eth.Contract(
            this.abi,
            this.contractAddress
        );
        return await contract.methods.slot0().call();
    }
}
