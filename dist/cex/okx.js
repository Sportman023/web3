"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OkxService = void 0;
const CryptoJS = __importStar(require("crypto-js"));
const ACCESS_KEY = process.env.OKX_ACCESS_KEY;
const PASSPHRASE = process.env.OKX_PASSPHRASE;
const SECRET_KEY = process.env.OKX_SECRET_KEY;
class OkxService {
    okxConfig;
    pair;
    constructor(okxConfig, pair) {
        this.okxConfig = okxConfig;
        this.pair = pair;
    }
    async getPrice() {
        const baseUrl = this.okxConfig.get('baseUrl');
        const getPricePath = this.okxConfig.get('getPricePath');
        const pairConfig = this.okxConfig.get(this.pair);
        const pathWithSymbol = `${getPricePath}&uly=${pairConfig.get('symbol')}`;
        const url = `${baseUrl}${pathWithSymbol}`;
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
        const body = await response.json();
        const item = body.data.at(0);
        return {
            buyOneOfToken0: Number(item.markPx),
            buyOneOfToken1: 1 / item.markPx,
        };
    }
    signRequest(timestamp, method, requestPath, secretKey, body) {
        const message = timestamp + method + requestPath + body;
        const hmacSHA256 = CryptoJS.HmacSHA256(message, secretKey);
        const signature = CryptoJS.enc.Base64.stringify(hmacSHA256);
        return signature;
    }
}
exports.OkxService = OkxService;
