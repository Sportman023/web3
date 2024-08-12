const { PrismaClient } = require('@prisma/client');
const util = require('node:util');

const prisma = new PrismaClient();

async function getAllData() {
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

    console.log(util.inspect(allData, { showHidden: true, depth: null, colors: true })); 
    return allData;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllData();