const { PrismaClient } = require('@prisma/client');
const util = require('node:util');

const prisma = new PrismaClient();

async function print() {
  try {
    const allData = await prisma.exchange.findMany({
      include: {
        tradingPairs: {
          include: {
            baseCurrency: true,
            quoteCurrency: true
          }
        }
      }
    });

    const opps = await prisma.arbitrageOpportunity.findMany();

    console.log(util.inspect(allData, { showHidden: true, depth: null, colors: true }));
    console.log(util.inspect(opps, { showHidden: true, depth: null, colors: true }));
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

print();