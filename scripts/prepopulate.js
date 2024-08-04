const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create exchanges
    let exchanges = await prisma.exchange.findMany();

    console.log('Exchanges founded:', exchanges.map(e => e.name));

    // Create cryptocurrencies
    const cryptocurrencies = await Promise.all([
      prisma.cryptocurrency.create({
        data: { symbol: 'BTC', name: 'Bitcoin', decimalPlaces: 8 }
      }),
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
              name: `${baseCurrency.symbol}/USDT`,
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

    // Create some sample latest prices
    for (const pair of tradingPairs) {
      let basePrice;
      switch (pair.name.split('/')[0]) {
        case 'BTC': basePrice = 30000; break;
        case 'ETH': basePrice = 2000; break;
        case 'XRP': basePrice = 0.5; break;
        case 'LTC': basePrice = 100; break;
        default: basePrice = 1;
      }
      
      const lastPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.01; // +/- 0.5%
      await prisma.latestPrice.create({
        data: {
          tradingPair: { connect: { id: pair.id } },
          timestamp: new Date(),
          lastPrice: lastPrice,
          bidPrice: lastPrice * 0.9995, // 0.05% below last price
          askPrice: lastPrice * 1.0005 // 0.05% above last price
        }
      });
    }

    console.log('Sample latest prices created for all trading pairs');

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