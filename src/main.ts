import 'dotenv/config';
import config from 'config';
import { UniswapService } from './dex';
import { OkxService, BinanceService } from './cex';
import { CSVBuilder } from './report/csvBuilder';
import { TelegramBot } from './transport/telegram';

class Main {

    private readonly bot: TelegramBot;
    private readonly reportBuilder: CSVBuilder;
    private reportRecords: any[] = [];

    constructor() {
        this.bot = new TelegramBot();
        this.reportBuilder = new CSVBuilder();
    }

    public bootstrap(): void {
        try {
            this.startTrackPairs();
            this.startReporting();
        } catch (e) {
            console.log(e);
        }
    }

    public startReporting() {
        const chatIds = process.env.TELEGRAM_CHAT_IDS as string;
        const ids = chatIds.split(',');
        setInterval(async () => {
            if (!this.reportRecords.length) {
                ids.forEach(async chatId => {
                    await this.bot.sendMessage(chatId, '🗑️ No opportunities to arbitration.');
                })
                return;
            }
            const csv = this.reportBuilder.prepareDocument(this.reportRecords);
            ids.forEach(async chatId => {
                await this.bot.sendDocument(chatId, csv);
            })
            this.reportRecords = [];
        }, 1000 * 30);
    }

    public startTrackPairs() {
        setInterval(async () => {
            console.log('🎬', new Date().toISOString());
            const promises: Promise<any>[] = [];
            promises.push(this.uniswap());
            promises.push(this.binance());
            promises.push(this.okx());
            const [UNISWAP, BINANCE, OKX] = await Promise.all(promises);
            const ethUsdtValues = [ UNISWAP['ETH-USDT'], BINANCE['ETH-USDT'], OKX['ETH-USDT']];
            const valid = this.validateOpportunity(ethUsdtValues, 5);
            if (valid.isValid) {
                this.reportRecords.push({
                    pairs: { UNISWAP, BINANCE, OKX },
                    maxShift: valid.maxShift
                })
            }

            console.log('────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────⋆⋅☆⋅⋆──────\n');
        }, 5000);
    }

    private async uniswap() {
        const pairConfig: any = config.get('uniswap.ethUsdt');
        const uniswapService: UniswapService = new UniswapService(pairConfig);

        const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
        const result = this.formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Uniswap');
        console.log(`${result.provider}: `, { ...result.tokenPrices });

        return result.tokenPrices;
    }

    private async binance() {
        const binanceConfig: any = config.get('binance');
        const pairConfig: any = binanceConfig.get('ethUsdt');

        const binanceService: BinanceService = new BinanceService(
            binanceConfig,
            'ethUsdt'
        );
        const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
        const result = this.formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, 'Binance');
        console.log(`${result.provider}: `, { ...result.tokenPrices });

        return result.tokenPrices;
    }

    private async okx() {
        const okxConfig: any = config.get('okx');
        const pairConfig: any = config.get('okx.ethUsdt');

        const okxService = new OkxService(okxConfig, 'ethUsdt');
        const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
        const result = this.formatPrices(pairConfig, buyOneOfToken0, buyOneOfToken1, 'OKX');
        console.log(`${result.provider}: `, { ...result.tokenPrices });

        return result.tokenPrices;
    }

    private formatPrices(pairConfig: any, buyOneOfToken0: number, buyOneOfToken1: number, provider: string) {
        const token0Symbol: string = pairConfig.get('token0Symbol');
        const token1Symbol: string = pairConfig.get('token1Symbol');

        let tokenPrices: any = {
            [token0Symbol]: buyOneOfToken0,
            [token1Symbol]: buyOneOfToken1,
        };

        return { provider, tokenPrices }
    }

    private validateOpportunity(ethUsdtValues: number[], opportunityValue: number = 10) {
        let maxShift = 0;

        for (let i = 0; i < ethUsdtValues.length; i++) {
            for (let j = i + 1; j < ethUsdtValues.length; j++) {
                const shift = Math.abs(ethUsdtValues[i] - ethUsdtValues[j]);
                maxShift = Math.max(maxShift, shift);
            }
        }

        return {
            isValid: maxShift > opportunityValue,
            maxShift: maxShift
        };
    }
}

new Main().bootstrap();
