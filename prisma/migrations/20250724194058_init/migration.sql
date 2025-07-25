-- CreateTable
CREATE TABLE "Servizio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "prezzoCliente" DOUBLE PRECISION NOT NULL,
    "costoNetto" DOUBLE PRECISION NOT NULL,
    "ivaPercent" DOUBLE PRECISION NOT NULL DEFAULT 22,

    CONSTRAINT "Servizio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServizioEffettuato" (
    "id" SERIAL NOT NULL,
    "servizioId" INTEGER NOT NULL,
    "quantita" INTEGER NOT NULL,
    "prezzoCliente" DOUBLE PRECISION NOT NULL,
    "costoTotale" DOUBLE PRECISION NOT NULL,
    "guadagno" DOUBLE PRECISION NOT NULL,
    "turno" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServizioEffettuato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spedizione" (
    "id" SERIAL NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "pellicola" BOOLEAN NOT NULL DEFAULT false,
    "imballaggio" BOOLEAN NOT NULL DEFAULT false,
    "prezzoPoste" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL,
    "rimborsoSpese" DOUBLE PRECISION NOT NULL,
    "prezzoCliente" DOUBLE PRECISION NOT NULL,
    "guadagno" DOUBLE PRECISION NOT NULL,
    "turno" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spedizione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chiusura" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "turno" TEXT NOT NULL,
    "totaleEntrate" DOUBLE PRECISION NOT NULL,
    "totaleCosti" DOUBLE PRECISION NOT NULL,
    "totaleGuadagni" DOUBLE PRECISION NOT NULL,
    "chiuso" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Chiusura_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServizioEffettuato" ADD CONSTRAINT "ServizioEffettuato_servizioId_fkey" FOREIGN KEY ("servizioId") REFERENCES "Servizio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
