"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeDustService = void 0;
const sdk_1 = require("@dedust/sdk");
const ton_1 = require("@ton/ton");
const crypto_1 = require("@ton/crypto");
const ASSETS = {
    TON: sdk_1.Asset.native(),
    USDT: sdk_1.Asset.jetton(ton_1.Address.parse("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs")),
};
class DeDustService {
    tonClient;
    factory;
    constructor() {
        this.tonClient = new ton_1.TonClient4({
            endpoint: "https://mainnet-v4.tonhubapi.com",
        });
        this.factory = this.tonClient.open(sdk_1.Factory.createFromAddress(sdk_1.MAINNET_FACTORY_ADDR));
    }
    startTrackPairs() {
        setInterval(async () => {
            const tonToUsdt = await this.estimateSwapAmount(ASSETS.TON, ASSETS.USDT, 1);
            const usdtToTon = await this.estimateSwapAmount(ASSETS.USDT, ASSETS.TON, 1);
            console.log({ tonToUsdt, usdtToTon });
        }, 5000);
    }
    async swapTonToUsdt(amountOfTon) {
        const mnemonic = this.convertMnemonicStringToArray(process.env.MNEMONIC);
        const keys = await (0, crypto_1.mnemonicToPrivateKey)(mnemonic);
        const wallet = this.tonClient.open(ton_1.WalletContractV4.create({
            workchain: 0,
            publicKey: keys.publicKey,
        }));
        const sender = wallet.sender(keys.secretKey);
        await this.swapTokens(sender, ASSETS.TON, ASSETS.USDT, amountOfTon);
    }
    async estimateSwapAmount(fromToken, toToken, amount) {
        const pool = await this.factory.getPool(sdk_1.PoolType.VOLATILE, [
            fromToken,
            toToken,
        ]);
        const provider = this.tonClient.provider(pool.address);
        const { amountOut } = await pool.getEstimatedSwapOut(provider, {
            amountIn: (0, ton_1.toNano)(amount),
            assetIn: fromToken,
        });
        const result = Number((0, ton_1.fromNano)(amountOut));
        if (fromToken === ASSETS.TON && toToken === ASSETS.USDT) {
            return result * 1000;
        }
        else if (fromToken === ASSETS.USDT && toToken === ASSETS.TON) {
            return result / 1000;
        }
        else {
            return result;
        }
    }
    async swapTokens(sender, fromToken, toToken, amount) {
        const tonVault = this.tonClient.open(await this.factory.getNativeVault());
        const pool = await this.factory.getPool(sdk_1.PoolType.VOLATILE, [
            fromToken,
            toToken,
        ]);
        const provider = this.tonClient.provider(pool.address);
        if ((await pool.getReadinessStatus(provider)) !== sdk_1.ReadinessStatus.READY) {
            throw new Error("Pool (TON, SCALE) does not exist.");
        }
        if ((await tonVault.getReadinessStatus()) !== sdk_1.ReadinessStatus.READY) {
            throw new Error("Vault (TON) does not exist.");
        }
        try {
            tonVault.sendSwap(sender, {
                poolAddress: pool.address,
                amount: (0, ton_1.toNano)(amount),
                gasAmount: (0, ton_1.toNano)("0.01"),
            });
        }
        catch (e) {
            console.log(e);
        }
    }
    convertMnemonicStringToArray(mnemonicString) {
        if (!mnemonicString) {
            throw new Error("Mnemonic phrase cannot be empty.");
        }
        return mnemonicString.trim().split(/\s+/);
    }
}
exports.DeDustService = DeDustService;
