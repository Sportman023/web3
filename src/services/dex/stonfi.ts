import { DEX } from "@ston-fi/sdk";

import {
    TonClient,
    toNano,
    fromNano,
    Address,
    WalletContractV4,
    OpenedContract,
    ContractProvider
} from "@ton/ton";
import { CreateSwapOptions } from "../../types";

  export class StonFiService {
    private readonly tonClient: TonClient;

    constructor() {
      this.tonClient = new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
      });
    }

  public async getPrice() {
    const askAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    const offerAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const offerUnits =  '300';
    const slippageTolerance = '0.01';
    return this.simulateSwap({askAddress, offerAddress, offerUnits, slippageTolerance});
    // try {
    //   const address = Address.parse("EQD8TJ8xEWB1SpnRE4d89YO3jl0W0EiBnNS4IBaHaUmdfizE");
    //   const pool = DEX.v1.Pool.create(address);
    //   const poolData = await pool.getPoolData(this.tonClient.provider(address));
    //   console.log({poolData});
    // } catch (e) {
    //   console.log(e);
    // }
  }

  public async simulateSwap(query: {
    askAddress: string;
    offerAddress: string;
    offerUnits: string;
    slippageTolerance: string;
    referralAddress?: string;
  }) {
  let result = { data: null, message: null };

  const baseUrl = 'https://api.ston.fi/v1/swap/simulate';
  const url = new URL(baseUrl);
  const params = new URLSearchParams({
    ask_address: query.askAddress,
    offer_address: query.offerAddress,
    units: query.offerUnits,
    slippage_tolerance: query.slippageTolerance
  });

  url.search = params.toString();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Stonfi status: ${response.status}, ${await response.text()}`);
    }

    result.data = await response.json();
  } catch (error: any) {
    result.message = error;
  }

  return result;
}

  // public async executeStonfiSwap(
  //   options: CreateSwapOptions,
  // ): Promise<{ query_id: number; router_address: string }> {
  //   const {
  //     askCurrency,
  //     offerAmount,
  //     offerCurrency,
  //     swapRate,
  //     queryId,
  //     walletAddress: userWalletAddress,
  //     privateKey,
  //     slippage,
  //   } = options;

  //   const address = Address.parse("EQD8TJ8xEWB1SpnRE4d89YO3jl0W0EiBnNS4IBaHaUmdfizE");
  //   const pool = DEX.v1.Pool.create(address);
  //   const provider = this.tonClient.provider(pool.address);

  //   const router = new DEX.v1.Router({
  //     tonApiClient: provider,
  //   });
  
  //   const highloadWalletV3 = HighloadWalletV3.createFromAddress(
  //     Address.parse(userWalletAddress),
  //   );
  
  //   const queryIdTracker = (await HighloadWalletQueryIdTracker.checkExists(
  //     userWalletAddress,
  //   ))
  //     ? await HighloadWalletQueryIdTracker.existingFromAddress(userWalletAddress)
  //     : await HighloadWalletQueryIdTracker.newFromAddress(userWalletAddress);
  
  //   const highloadWalletV3Contract = this.tonClient.open(highloadWalletV3);
  
  //   let txParams: MessageData;
  
  //   const askCurrencyDigits = getCurrencyDigits(askCurrency);
  //   const offerCurrencyDigits = getCurrencyDigits(offerCurrency);
  
  //   const offerAmountDecimal = Math.round(
  //     offerAmount * 10 ** offerCurrencyDigits,
  //   );
  
  //   const minAskAmount = String(
  //     Math.round(
  //       (offerAmount / swapRate) * (1 - slippage) * 10 ** askCurrencyDigits,
  //     ),
  //   );
  
  //   if (askCurrency === "TON") {
  //     txParams = await router.buildSwapJettonToTonTxParams({
  //       userWalletAddress,
  //       offerJettonAddress: getJettonAddress(offerCurrency),
  //       offerAmount: new TonWeb.utils.BN(offerAmountDecimal.toString()),
  //       minAskAmount,
  //       proxyTonAddress: pTON.v1.address,
  //       queryId,
  //     });
  //   } else if (offerCurrency === "TON") {
  //     txParams = await router.buildSwapTonToJettonTxParams({
  //       userWalletAddress,
  //       askJettonAddress: getJettonAddress(askCurrency),
  //       minAskAmount,
  //       offerAmount: new TonWeb.utils.BN(offerAmountDecimal.toString()),
  //       proxyTonAddress: pTON.v1.address,
  //       queryId,
  //     });
  //   } else {
  //     txParams = await router.buildSwapJettonToJettonTxParams({
  //       userWalletAddress,
  
  //       askJettonAddress: getJettonAddress(askCurrency),
  //       offerJettonAddress: getJettonAddress(offerCurrency),
  
  //       minAskAmount,
  //       offerAmount: new TonWeb.utils.BN(offerAmountDecimal.toString()),
  
  //       queryId,
  //     });
  //   }
  
  //   const highloadQueryId = await queryIdTracker.getNext();
  
  //   await retry(
  //     async () => {
  //       const repeatForSanity = 3;
  
  //       const message = internal({
  //         to: txParams.to.toString(),
  //         value: TonWeb.utils.fromNano(txParams.gasAmount).toString(),
  //         body: Cell.fromBase64(
  //           TonWeb.utils.bytesToBase64(await txParams.payload.toBoc()),
  //         ),
  //       });
  
  //       for (let i = 0; i < repeatForSanity; i++) {
  //         await highloadWalletV3Contract.sendExternalMessage(
  //           Buffer.from(privateKey, "base64"),
  //           {
  //             createdAt: timestampHelper.getNow(),
  //             mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
  //             subwalletId: SUBWALLET_ID,
  //             timeout: HIGHLOAD_WALLET_TIMEOUT,
  //             query_id: highloadQueryId,
  //             message,
  //           },
  //         );
  //       }
  //     },
  //     {
  //       retryIf: logRetryError,
  //       timeout: "INFINITELY",
  //       retries: "INFINITELY",
  //       delay: 1000,
  //     },
  //   );

  //   return {
  //     query_id: queryId,
  //     router_address: router.address!.toString(),
  //   };
  // }
}