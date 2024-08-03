export class BinanceService {
  private binanceConfig: any;
  private pair: string;
  constructor(binanceConfig: any, pair: string) {
    this.binanceConfig = binanceConfig;
    this.pair = pair;
  }

  public async getPrice(): Promise<{
    buyOneOfToken0: number;
    buyOneOfToken1: number;
  }> {
    const baseUrl: string = this.binanceConfig.get('baseUrl');
    const getPricePath: string = this.binanceConfig.get('getPricePath');
    const pairConfig: any = this.binanceConfig.get(this.pair);

    const url: string = `${baseUrl}${getPricePath}?symbol=${pairConfig.get('symbol')}`;

    let buyOneOfToken0: number = 0;
    let buyOneOfToken1: number = 0;

    try {
      const response: Response = await fetch(url);
      const body: any = await response.json();

      buyOneOfToken0 = Number(body.price);
      buyOneOfToken1 = 1 / body.price;
    } catch (error) {
      console.error(`Error fetching the ${this.pair} rate`, error);
    }
    return { buyOneOfToken0, buyOneOfToken1 };
  }
}
