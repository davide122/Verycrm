/*
  Warnings:

  - Added the required column `sede` to the `ServizioEffettuato` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sede` to the `Spedizione` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServizioEffettuato" DROP CONSTRAINT "ServizioEffettuato_servizioId_fkey";

-- AlterTable
ALTER TABLE "ServizioEffettuato" ADD COLUMN     "sede" TEXT NOT NULL,
ALTER COLUMN "servizioId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Spedizione" ADD COLUMN     "sede" TEXT NOT NULL;
