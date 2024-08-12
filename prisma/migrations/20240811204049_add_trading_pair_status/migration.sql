/*
  Warnings:

  - Added the required column `status` to the `TradingPair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TradingPair" ADD COLUMN     "status" TEXT NOT NULL;
