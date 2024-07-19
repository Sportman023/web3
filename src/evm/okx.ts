import 'dotenv/config';
import * as CryptoJS from 'crypto-js';

const ACCESS_KEY = process.env.OKX_ACCESS_KEY as string;
const PASSPHRASE = process.env.OKX_PASSPHRASE as string;
const SECRET_KEY = process.env.OKX_SECRET_KEY as string;
const API_URL = 'https://www.okx.com/api/v5/asset/convert-dust-assets';
const REQUEST_PATH = '/api/v5/asset/convert-dust-assets';

export class OkxService {
    constructor() {}

    public async getPrice(): Promise<{
        buyOneOfToken0: number;
        buyOneOfToken1: number;
    }> {
        const body = { ccy: ['ETH', 'USDT'] };

        const timestamp = new Date().toISOString();

        const signature = this.signRequest(
            timestamp,
            'POST',
            REQUEST_PATH,
            SECRET_KEY,
            JSON.stringify(body)
        );

        const response = await fetch(API_URL, {
            method: 'post',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'OK-ACCESS-SIGN': signature,
                'OK-ACCESS-TIMESTAMP': timestamp,
                'OK-ACCESS-KEY': ACCESS_KEY,
                'OK-ACCESS-PASSPHRASE': PASSPHRASE,
            },
        });
        const data = await response.json();

        console.log(data);

        return {
            buyOneOfToken0: 0,
            buyOneOfToken1: 0,
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
