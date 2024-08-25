/*
  Warnings:

  - You are about to drop the column `tradingPairId` on the `ArbitrageOpportunity` table. All the data in the column will be lost.
  - Added the required column `tradingPairName` to the `ArbitrageOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ArbitrageOpportunity" DROP CONSTRAINT "ArbitrageOpportunity_tradingPairId_fkey";

-- AlterTable
ALTER TABLE "ArbitrageOpportunity" DROP COLUMN "tradingPairId",
ADD COLUMN     "tradingPairName" TEXT NOT NULL;
