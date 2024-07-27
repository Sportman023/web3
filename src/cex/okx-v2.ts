import CryptoJS from "crypto-js";

const api_key = process.env.API_KEY;
const secret_key = process.env.SECRET_KEY;
const passphras = process.env.PASSPHRAS;

export function signature(
  timestamp,
  method,
  request_path = "/api/v5/account/balance",
  secret_key,
  body = ""
) {
  const sign = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(timestamp + method + request_path + body, secret_key)
  );
  return sign;
}

export function setHeaders(
  api_key,
  secret_key,
  passphras,
  request_path = "/api/v5/account/balance",
  body = "",
  meth = "GET"
) {
  let headers;
  try {
    const timestamp = new Date().toISOString();
    headers = {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": api_key,
      "OK-ACCESS-SIGN": signature(
        timestamp,
        meth,
        request_path,
        secret_key,
        body
      ),
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": passphras,
      "x-simulated-trading": "0",
    };
  } catch (e) {
    console.log("Error :" + e.message);
  }

  return headers;
}

export async function getBalance() {
  const headers = setHeaders(
    api_key,
    secret_key,
    passphras,
    "/api/v5/asset/balances"
  );

  const balance = await fetch(`https://www.okx.com/api/v5/asset/balances`, {
    headers,
  })
    .then((data) => data.json())
    .then((balance) => balance.data)
    .catch((error) => console.log("Error: " + error.message));

  const balanceList: any[] = [];
  balance.map((el: any) => {
    balanceList.push({ ccy: el.ccy, availBal: el.bal });
  });
  return balanceList;
}

export async function getCurrencies(ccy = "") {
  const headers = setHeaders(
    api_key,
    secret_key,
    passphras,
    `/api/v5/asset/currencies?ccy=${ccy}`
  );
  let currencies = await fetch(
    `https://www.okx.com/api/v5/asset/currencies?ccy=${ccy}`,
    { headers }
  )
    .then((data) => data.json())
    .then((currencies) => currencies.data)
    .catch((error) => console.log("Error: " + error.message));

  let currenciesList: any[] = [];
  currencies.map((el) => {
    currenciesList.push({
      ccy: el.ccy,
      logoLink: el.logoLink,
      chain: el.chain,
      minFee: el.minFee,
    });
  });
  return currenciesList;
}

export async function getPriceList(tokenList) {
  console.log(tokenList);
  let headers = setHeaders(
    api_key,
    secret_key,
    passphras,
    "/api/v5/waas/coin/price-list",
    "",
    "POST"
  );
  headers = {
    ...headers,
    "OK-ACCESS-PROJECT": "99d03b38bbdeadc1be7de489b16af287",
  };
  console.log(headers);
  let priceList = await fetch(
    `https://www.okx.com/api/v5/waas/coin/price-list`,
    {
      headers,
      method: "POST",
      body: JSON.stringify(tokenList),
    }
  )
    .then((data) => data.json())
    .then((data) => console.log(data))
    .then((currencies) => currencies.data)
    .catch((error) => console.log("Error: " + error.message));
  console.log(priceList);
  return priceList;
}

export async function transfer() {
  try {
    console.log("function transfer: " + passphras);
    if (true) {
      const body = {
        ccy: "USDT",
        amt: 5.0,
        from: 6,
        to: 18,
      };

      const request_path = "/api/v5/asset/transfer";
      const headers = setHeaders(
        api_key,
        secret_key,
        passphras,
        request_path,
        JSON.stringify(body),
        "POST"
      );
      const transfer = await fetch(
        "https://www.okx.com/api/v5/asset/transfer",
        { method: "POST", headers, body: JSON.stringify(body) }
      )
        .then((data) => data.json())
        .then((data) => console.log(data));
    }
  } catch (err) {
    console.log(err.message);
  }
}
export async function withdrawal(AMOUNT, SYMBOL, CHAIN, wallet) {
  try {
    const FEE = (await getCurrencies(SYMBOL)).filter(
      (el) => el.chain === CHAIN
    )[0].minFee;

    if (true) {
      const body = {
        ccy: SYMBOL,
        amt: AMOUNT,
        fee: FEE,
        dest: "4",
        chain: `${CHAIN}`,
        toAddr: wallet,
      };

      const request_path = "/api/v5/asset/withdrawal";
      const headers = setHeaders(
        api_key,
        secret_key,
        passphras,
        request_path,
        JSON.stringify(body),
        "POST"
      );
      const transfer = await fetch(
        "https://www.okx.com/api/v5/asset/withdrawal",
        { method: "POST", headers, body: JSON.stringify(body) }
      ).then((data) => data.json());
      return transfer;
    }
  } catch (err) {
    return { Error: err.message };
  }
}