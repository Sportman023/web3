const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Delete all trading pairs
    await prisma.tradingPair.deleteMany();
    console.log('All trading pairs deleted');

    // Delete all cryptocurrencies
    await prisma.cryptocurrency.deleteMany();
    console.log('All cryptocurrencies deleted');

    // Add more deleteMany operations here for any other tables you want to clear
    // For example:
    // await prisma.someOtherTable.deleteMany();

    console.log('Database cleared successfully (excluding Exchanges)');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

async function main() {
  try {

    await clearDatabase();
    // Create exchanges
    let exchanges = await prisma.exchange.findMany();

    console.log('Exchanges founded:', exchanges.map(e => e.name));

    // Create cryptocurrencies
    const cryptocurrencies = await Promise.all([
      prisma.cryptocurrency.create({
        data: { symbol: 'ETH', name: 'Ethereum', decimalPlaces: 18 }
      }),
      prisma.cryptocurrency.create({
        data: { symbol: 'USDT', name: 'Tether', decimalPlaces: 6 }
      }),
      prisma.cryptocurrency.create({
        data: { symbol: 'ZRO', name: 'Layer Zero', decimalPlaces: 18 }
      }),
    ]);

    console.log('Cryptocurrencies created:', cryptocurrencies.map(c => c.symbol));

    // Find USDT as the quote currency
    const usdt = cryptocurrencies.find(c => c.symbol === 'USDT');

    // Create trading pairs
    let tradingPairs = [];
    for (const exchange of exchanges) {
      for (const baseCurrency of cryptocurrencies) {
        if (baseCurrency.symbol !== 'USDT') {
          const pair = await prisma.tradingPair.create({
            data: {
              name: `${baseCurrency.symbol}USDT`,
              status: 'active',
              exchange: { connect: { id: exchange.id } },
              baseCurrency: { connect: { id: baseCurrency.id } },
              quoteCurrency: { connect: { id: usdt.id } },
              minOrderSize: 0.001,
              maxOrderSize: 100,
              tradingFee: 0.001
            }
          });
          tradingPairs.push(pair);
        }
      }
    }

    console.log('Trading pairs created:', tradingPairs.map(tp => `${tp.name} on ${exchanges.find(e => e.id === tp.exchangeId).name}`));

  } catch (error) {
    console.error('Error in populating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });