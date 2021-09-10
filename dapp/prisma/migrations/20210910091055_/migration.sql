/*
  Warnings:

  - Added the required column `checkedAt` to the `DiscordChecks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscordChecks" ADD COLUMN     "checkedAt" TIMESTAMP(3) NOT NULL;
