-- CreateEnum
CREATE TYPE "StatoTask" AS ENUM ('DA_FARE', 'IN_CORSO', 'COMPLETATO', 'ANNULLATO');

-- CreateTable
CREATE TABLE "TodoTask" (
    "id" SERIAL NOT NULL,
    "titolo" TEXT NOT NULL,
    "descrizione" TEXT,
    "dataScadenza" TIMESTAMP(3),
    "orarioInizio" TIMESTAMP(3),
    "orarioFine" TIMESTAMP(3),
    "stato" "StatoTask" NOT NULL DEFAULT 'DA_FARE',
    "priorita" INTEGER NOT NULL DEFAULT 0,
    "sede" TEXT NOT NULL,
    "assegnatoA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoTask_pkey" PRIMARY KEY ("id")
);
