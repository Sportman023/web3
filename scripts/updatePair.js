const { PrismaClient } = require('@prisma/client');
const util = require('node:util');

const prisma = new PrismaClient();

(async function run() {
  // let exchange = await prisma.exchange.findUnique({ where: { name: 'OKX' } });
  // let baseCurrency = await prisma.cryptocurrency.findUnique({ where: { symbol: 'TON' } });
  // let usdt = await prisma.cryptocurrency.findUnique({ where: { symbol: 'USDT' } });
  const tradingPairIdsToUpdate = [17, 18, 19, 20, 21, 22, 23, 26];
  const tradingPairBefore = await prisma.tradingPair.findMany({
    where: {
      id: {
        in: tradingPairIdsToUpdate,
      },
    },
  });

  console.log(`Before ${util.inspect(tradingPairBefore, { showHidden: false, depth: null, colors: true })}`);

  await prisma.tradingPair.updateMany({
    where: {
      id: {
        in: tradingPairIdsToUpdate,
      },
    },
    data: {
      status: 'inactive',
    },
  });

  const tradingPairAfter = await prisma.tradingPair.findMany({
    where: {
      id: {
        in: tradingPairIdsToUpdate,
      },
    },
  });

  console.log(`After ${util.inspect(tradingPairAfter, { showHidden: false, depth: null, colors: true })}`);
})();
