const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllData() {
  try {
    const allData = await prisma.exchange.findMany({
      include: {
        tradingPairs: {
          include: {
            baseCurrency: true,
            quoteCurrency: true,
            latestPrice: true
          }
        }
      }
    });

    console.log(JSON.stringify(allData, null, 2));
    return allData;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllData();