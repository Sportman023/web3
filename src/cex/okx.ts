import * as CryptoJS from 'crypto-js';

const ACCESS_KEY = process.env.OKX_ACCESS_KEY as string;
const PASSPHRASE = process.env.OKX_PASSPHRASE as string;
const SECRET_KEY = process.env.OKX_SECRET_KEY as string;
const BASE_URL = 'https://www.okx.com';
const REQUEST_PATH = '/api/v5/public/price-limit?instId=1INCH-USDT-SWAP';

export class OkxService {
    constructor() {}

    public async getPrice(): Promise<{
        buyOneOfToken0: number;
        buyOneOfToken1: number;
    }> {
        const timestamp = new Date().toISOString();

        const signature = this.signRequest(
            timestamp,
            'GET',
            REQUEST_PATH,
            SECRET_KEY,
            ''
        );

        const response = await fetch(BASE_URL + REQUEST_PATH, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'OK-ACCESS-SIGN': signature,
                'OK-ACCESS-TIMESTAMP': timestamp,
                'OK-ACCESS-KEY': ACCESS_KEY,
                'OK-ACCESS-PASSPHRASE': PASSPHRASE,
            },
        });
        const data: any = await response.json();
        const item = data.data.at(0);

        return {
            buyOneOfToken0: Number(item.buyLmt),
            buyOneOfToken1: 1 / item.buyLmt,
        };
    }

    signRequest(
        timestamp: string,
        method: string,
        requestPath: string,
        secretKey: string,
        body: string
    ): string {
        const message = timestamp + method + requestPath + body;
        const hmacSHA256 = CryptoJS.HmacSHA256(message, secretKey);
        const signature = CryptoJS.enc.Base64.stringify(hmacSHA256);

        // CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(timestamp + 'GET' + '/api/v5/account/balance?ccy=BTC', secretKey))

        return signature;
    }
}
