/*
  Warnings:

  - The primary key for the `TwitterChecks` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "TwitterChecks" DROP CONSTRAINT "TwitterChecks_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
