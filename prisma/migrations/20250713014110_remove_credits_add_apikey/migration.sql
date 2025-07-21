/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastCreditRefresh` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `paidCredits` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits",
DROP COLUMN "lastCreditRefresh",
DROP COLUMN "paidCredits",
ADD COLUMN     "openRouterApiKey" TEXT;
