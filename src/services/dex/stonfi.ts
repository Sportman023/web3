import { DEX, pTON } from '@ston-fi/sdk';

import { TonClient, toNano, WalletContractV4, Address, JettonMaster, JettonWallet, fromNano } from '@ton/ton';
import { CreateSwapOptions } from '../../types';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { mnemonicToPrivateKey } from '@ton/crypto';

export class StonFiService {
  constructor() {}

  public async getPrice(query: {
    askAddress: string;
    offerAddress: string;
    offerUnits: string;
    slippageTolerance: string;
    referralAddress?: string;
  }) {
    let result = { data: null, message: null };

    const baseUrl = 'https://api.ston.fi/v1/reverse_swap/simulate';
    const url = new URL(baseUrl);
    const params = new URLSearchParams({
      ask_address: query.askAddress,
      offer_address: query.offerAddress,
      units: query.offerUnits,
      slippage_tolerance: query.slippageTolerance,
    });

    url.search = params.toString();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  public async executeStonfiSwap(options: CreateSwapOptions): Promise<{ query_id: number; router_address: string }> {
    const {
      askCurrency,
      offerAmount,
      offerCurrency,
      swapRate,
      queryId,
      walletAddress: userWalletAddress,
      privateKey,
      slippage,
      pairConfig,
    } = options;

    const endpoint = await getHttpEndpoint({ network: pairConfig['network'] });
    const client = new TonClient({
      endpoint,
    });

    const router = client.open(DEX.v2_1.Router.create(pairConfig['routerAddress']));
    const proxyTon = pTON.v2_1.create(pairConfig['proxyTonAddress']); // NOTE: pTON.v2_1.address returns mainnet address

    const mnemonic = process.env.TON_KEEPER_WALLET_MNEMONIC_PHRASE as string;
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));

    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const walletContract = client.open(wallet);
    const jettonAddress = pairConfig['quoteCurrencyAddress'];

    const jettonWalletContract = await this.getJettonWalletContract(client, userWalletAddress, jettonAddress);
    const jettonBalanceBefore = await jettonWalletContract.getBalance();

    if (askCurrency === 'TON') {
      const minAskAmount = (offerAmount / swapRate) * (1 - slippage);

      const txArgs = {
        userWalletAddress,
        proxyTon,
        offerJettonAddress: jettonAddress,
        offerAmount: toNano(offerAmount),
        minAskAmount: toNano(minAskAmount).toString(),
        queryId,
      };

      console.log('txArgs', txArgs);

      const seqno = await walletContract.getSeqno();
      const tonBalanceBefore = await walletContract.getBalance();

      await router.sendSwapJettonToTon(walletContract.sender(keyPair.secretKey), txArgs);
      await this.logTransactionExecution(seqno, walletContract, jettonBalanceBefore, jettonWalletContract);
      const tonBalanceAfter = await walletContract.getBalance();

      if (tonBalanceAfter > tonBalanceBefore) {
        console.log('Swap successful! Ton balance changed!');
      } else {
        console.log('Swap failed!');
      }
    } else if (offerCurrency === 'TON') {
      const minAskAmount = offerAmount * swapRate * (1 - slippage);
      const txArgs = {
        userWalletAddress,
        proxyTon,
        offerAmount: toNano(offerAmount),
        askJettonAddress: jettonAddress,
        minAskAmount: toNano(minAskAmount).toString(),
      };

      console.log('txArgs', txArgs);

      const seqno = await walletContract.getSeqno();

      await router.sendSwapTonToJetton(walletContract.sender(keyPair.secretKey), txArgs);
      await this.logTransactionExecution(seqno, walletContract, jettonBalanceBefore, jettonWalletContract);

      const jettonBalanceAfter = await jettonWalletContract.getBalance();
      if (jettonBalanceAfter > jettonBalanceBefore) {
        console.log('Swap successful! Jetton balance changed!');
      } else {
        console.log('Swap failed!');
      }
    } else {
      console.log('askCurrency', askCurrency);
      console.log('offerCurrency', offerCurrency);
    }

    return {
      query_id: queryId,
      router_address: router.address!.toString(),
    };
  }

  private async logTransactionExecution(seqno, walletContract, jettonBalance, jettonWalletContract) {
    let currentSeqno = seqno;
    console.log('currentSeqno', currentSeqno);

    while (currentSeqno == seqno) {
      console.log('wait for initial transaction to confirm...');
      await this.sleep(1500);
      currentSeqno = await walletContract.getSeqno();
    }
    console.log('Initial transaction confirmed!');

    const tonBalance = await walletContract.getBalance();
    let currentTonBalance = tonBalance;
    let currentJettonBalance = jettonBalance;

    // console.log('Init currentTonBalance', fromNano(currentTonBalance));
    // console.log('Init currentJettonBalance', fromNano(currentJettonBalance));

    while (currentTonBalance == tonBalance && currentJettonBalance == jettonBalance) {
      console.log('wait for jetton balance to change...');
      await this.sleep(1500);
      currentTonBalance = await walletContract.getBalance();
      currentJettonBalance = await jettonWalletContract.getBalance();
      // console.log('currentTonBalance', fromNano(currentTonBalance));
      // console.log('Init currentJettonBalance', fromNano(currentJettonBalance));
    }
  }

  private async getJettonWalletContract(client: TonClient, walletAddress: string, jettonMasterAddress: string) {
    const masterAddress = Address.parse(jettonMasterAddress);
    const ownerAddress = Address.parse(walletAddress);

    const jettonMaster = client.open(JettonMaster.create(masterAddress));
    const jettonWalletAddress = await jettonMaster.getWalletAddress(ownerAddress);

    console.log('Jetton Wallet Address:', jettonWalletAddress.toString());

    const jettonWalletContract = client.open(JettonWallet.create(jettonWalletAddress));
    return jettonWalletContract;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
