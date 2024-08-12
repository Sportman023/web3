/*
  Warnings:

  - You are about to drop the `LatestPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LatestPrice" DROP CONSTRAINT "LatestPrice_tradingPairId_fkey";

-- DropTable
DROP TABLE "LatestPrice";
