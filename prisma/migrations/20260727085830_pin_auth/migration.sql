/*
  Warnings:

  - You are about to drop the column `createdById` on the `InventoryDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `QuarterEntry` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryDocument" DROP CONSTRAINT "InventoryDocument_createdById_fkey";

-- DropForeignKey
ALTER TABLE "QuarterEntry" DROP CONSTRAINT "QuarterEntry_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "InventoryDocument" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "QuarterEntry" DROP COLUMN "updatedById";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Verification";
