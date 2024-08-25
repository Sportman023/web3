import { GetPriceResult } from "./getPriceResult.type";

export type ExchangeFunction = (pair: string) => Promise<GetPriceResult>;