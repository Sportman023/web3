export interface CreateSwapOptions {
	askCurrency: string;
	offerAmount: number;
	offerCurrency: string;
	swapRate: number;
	queryId: number;
	walletAddress: string;
	privateKey: string;
	slippage: number;
}