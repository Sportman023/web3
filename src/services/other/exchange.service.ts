import { GetPriceResult } from "../../types";
import { SwapSimulationResponse } from "../../types/swapSimulateResponse.type";
import { BinanceService } from "../cex/binance";
import { OkxService } from "../cex/okx";
import { DeDustService } from "../dex/dedust";
import { StonFiService } from "../dex/stonfi";
import { UniswapService } from "../dex/uniswap";

export class ExchangeService {

  private config: any;

  setConfig(config: any) {
    this.config = config;
  }

  public getPriceByExchange(exName: string, pair: string) {
    if (!exName) {
      throw new Error('Invalid exchange name');
    }

    const func = this.functionMap[exName];

    if (!func) {
      throw new Error(`There isn't function for "${exName}" exchange`);
    }

    return func(pair);
  }

  private uniswap = async (pair: string): Promise<GetPriceResult> => {
    const uniswapConfig: any = this.config.get('exchanges.uniswap');
    const pairConfig: any = uniswapConfig[pair];
    const netName: string = this.config.get('application.netByPair')[pair];
    const netUrlName: string = this.config.get('application.urlByNet')[netName];
    const uniswapService: UniswapService = new UniswapService(netName, netUrlName, pairConfig);

    const { buyOneOfToken0, buyOneOfToken1 } = await uniswapService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Uniswap');

    return result;
  }

  public dedust = async (pair: string): Promise<GetPriceResult> => {
    const dedustConfig: any = this.config.get('exchanges.dedust');
    const pairConfig: any = dedustConfig[pair];

    const dedustService = new DeDustService();
    const buyOneOfToken0 = await dedustService.getPrice('TON', 'USDT');
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Dedust');

    return result;
  }

  public stonfi = async (pair: string): Promise<GetPriceResult> => {
    const dedustConfig: any = this.config.get('exchanges.dedust');
    const pairConfig: any = dedustConfig[pair];

    const stonfi = new StonFiService();
    const priceWrapper = await stonfi.getPrice();
    if (priceWrapper.message) {
      throw new Error(priceWrapper.message);
    }

    if (priceWrapper.data == null) {
      throw new Error('Nullable data in stonfi');
    }

    const data: SwapSimulationResponse = priceWrapper.data;
    const result = this.formatGetPriceResult(pairConfig, Number(data.swap_rate), 'Stonfi');

    return result;
  }

  private binance = async (pair: string): Promise<GetPriceResult> => {
    const binanceConfig: any = this.config.get('exchanges.binance');
    const pairConfig: any = binanceConfig[pair];

    const binanceService: BinanceService = new BinanceService(binanceConfig, pair);
    const { buyOneOfToken0, buyOneOfToken1 } = await binanceService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'Binance');

    return result;
  }

  public okx = async (pair: string): Promise<GetPriceResult> => {
    const okxConfig: any = this.config.get('exchanges.okx');
    const pairConfig: any = okxConfig[pair];

    const okxService = new OkxService(okxConfig, pair);
    const { buyOneOfToken0, buyOneOfToken1 } = await okxService.getPrice();
    const result = this.formatGetPriceResult(pairConfig, buyOneOfToken0, 'OKX');

    return result;
  }

  private formatGetPriceResult(pairConfig: any, buyOneOfToken0: number, provider: string): GetPriceResult {
    const token0Symbol: string = pairConfig.get('token0Symbol');
    return { provider, pair: token0Symbol, price: buyOneOfToken0 };
  }

  private functionMap: { [key: string]: (pair: string) => Promise<GetPriceResult> } = {
    uniswap: this.uniswap,
    okx: this.okx,
    binance: this.binance,
    dedust: this.dedust,
    stonfi: this.stonfi
  };
}