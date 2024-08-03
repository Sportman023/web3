import * as CryptoJS from 'crypto-js';

const ACCESS_KEY = process.env.OKX_ACCESS_KEY as string;
const PASSPHRASE = process.env.OKX_PASSPHRASE as string;
const SECRET_KEY = process.env.OKX_SECRET_KEY as string;

export class OkxService {
  private okxConfig: any;
  private pair: string;
  constructor(okxConfig: any, pair: string) {
    this.okxConfig = okxConfig;
    this.pair = pair;
  }

  public async getPrice(): Promise<{
    buyOneOfToken0: number;
    buyOneOfToken1: number;
  }> {
    const baseUrl: string = this.okxConfig.get('baseUrl');
    const getPricePath: string = this.okxConfig.get('getPricePath');
    const pairConfig: any = this.okxConfig.get(this.pair);

    const pathWithSymbol: string = `${getPricePath}&uly=${pairConfig.get('symbol')}`;
    const url: string = `${baseUrl}${pathWithSymbol}`;

    const timestamp = new Date().toISOString();
    const signature = this.signRequest(timestamp, 'GET', this.okxConfig.get('getPricePath'), SECRET_KEY, '');

    const response = await fetch(url, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-KEY': ACCESS_KEY,
        'OK-ACCESS-PASSPHRASE': PASSPHRASE,
      },
    });
    const body: any = await response.json();
    const item = body.data.at(0);

    return {
      buyOneOfToken0: Number(item.markPx),
      buyOneOfToken1: 1 / item.markPx,
    };
  }

  signRequest(timestamp: string, method: string, requestPath: string, secretKey: string, body: string): string {
    const message = timestamp + method + requestPath + body;
    const hmacSHA256 = CryptoJS.HmacSHA256(message, secretKey);
    const signature = CryptoJS.enc.Base64.stringify(hmacSHA256);

    return signature;
  }
}
