const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


(async function run() {
  let exchange = await prisma.exchange.create({data: {
    name: 'Stonfi',
    apiKey: null,
    apiSecret: null,
    passphrase: null,
    status: 'active'
  }});
  let baseCurrency = await prisma.cryptocurrency.findUnique({where: {symbol: 'TON'}})
  let usdt = await prisma.cryptocurrency.findUnique({where: {symbol: 'USDT'}})

  const pair = await prisma.tradingPair.create({
    data: {
      name: `TONUSDT`,
      status: 'active',
      exchange: { connect: { id: exchange.id } },
      baseCurrency: { connect: { id: baseCurrency.id } },
      quoteCurrency: { connect: { id: usdt.id } },
      minOrderSize: 0.001,
      maxOrderSize: 100,
      tradingFee: 0.001
    }
  });

  console.log(pair);
})()