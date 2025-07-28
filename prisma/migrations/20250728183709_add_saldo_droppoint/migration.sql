/*
  Warnings:

  - You are about to drop the `Collo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Imballaggio` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Collo" DROP CONSTRAINT "Collo_spedizioneId_fkey";

-- DropForeignKey
ALTER TABLE "Imballaggio" DROP CONSTRAINT "Imballaggio_colloId_fkey";

-- DropTable
DROP TABLE "Collo";

-- DropTable
DROP TABLE "Imballaggio";

-- CreateTable
CREATE TABLE "SaldoDroppoint" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "saldoIniziale" DOUBLE PRECISION NOT NULL,
    "saldoFinale" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoDroppoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RicaricaDroppoint" (
    "id" SERIAL NOT NULL,
    "saldoId" INTEGER NOT NULL,
    "importo" DOUBLE PRECISION NOT NULL,
    "descrizione" TEXT,
    "turno" TEXT NOT NULL,
    "sede" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RicaricaDroppoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaldoDroppoint_data_key" ON "SaldoDroppoint"("data");

-- AddForeignKey
ALTER TABLE "RicaricaDroppoint" ADD CONSTRAINT "RicaricaDroppoint_saldoId_fkey" FOREIGN KEY ("saldoId") REFERENCES "SaldoDroppoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
