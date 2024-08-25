/*
  Warnings:

  - You are about to drop the `OrderBook` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserBalance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status` to the `ArbitrageOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderBook" DROP CONSTRAINT "OrderBook_tradingPairId_fkey";

-- DropForeignKey
ALTER TABLE "UserBalance" DROP CONSTRAINT "UserBalance_cryptocurrencyId_fkey";

-- DropForeignKey
ALTER TABLE "UserBalance" DROP CONSTRAINT "UserBalance_userId_fkey";

-- AlterTable
ALTER TABLE "ArbitrageOpportunity" ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "arbitrageOpportunityId" INTEGER;

-- DropTable
DROP TABLE "OrderBook";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserBalance";

-- CreateTable
CREATE TABLE "LatestPrice" (
    "id" SERIAL NOT NULL,
    "tradingPairId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lastPrice" DOUBLE PRECISION NOT NULL,
    "bidPrice" DOUBLE PRECISION NOT NULL,
    "askPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LatestPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeBalance" (
    "id" SERIAL NOT NULL,
    "exchangeId" INTEGER NOT NULL,
    "cryptocurrencyId" INTEGER NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LatestPrice_tradingPairId_key" ON "LatestPrice"("tradingPairId");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeBalance_exchangeId_cryptocurrencyId_key" ON "ExchangeBalance"("exchangeId", "cryptocurrencyId");

-- AddForeignKey
ALTER TABLE "LatestPrice" ADD CONSTRAINT "LatestPrice_tradingPairId_fkey" FOREIGN KEY ("tradingPairId") REFERENCES "TradingPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeBalance" ADD CONSTRAINT "ExchangeBalance_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeBalance" ADD CONSTRAINT "ExchangeBalance_cryptocurrencyId_fkey" FOREIGN KEY ("cryptocurrencyId") REFERENCES "Cryptocurrency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
