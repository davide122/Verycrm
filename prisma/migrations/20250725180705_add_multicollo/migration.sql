-- CreateTable
CREATE TABLE "Collo" (
    "id" SERIAL NOT NULL,
    "spedizioneId" INTEGER NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "dimensioni" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imballaggio" (
    "id" SERIAL NOT NULL,
    "colloId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantita" INTEGER NOT NULL DEFAULT 1,
    "costo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Imballaggio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Collo" ADD CONSTRAINT "Collo_spedizioneId_fkey" FOREIGN KEY ("spedizioneId") REFERENCES "Spedizione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imballaggio" ADD CONSTRAINT "Imballaggio_colloId_fkey" FOREIGN KEY ("colloId") REFERENCES "Collo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
