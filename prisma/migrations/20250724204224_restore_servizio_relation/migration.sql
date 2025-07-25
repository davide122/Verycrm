/*
  Warnings:

  - Changed the type of `servizioId` on the `ServizioEffettuato` table. Converting string values to integers.

*/
-- AlterTable: Convert servizioId from TEXT to INTEGER
ALTER TABLE "ServizioEffettuato" ALTER COLUMN "servizioId" TYPE INTEGER USING "servizioId"::INTEGER;

-- AddForeignKey
ALTER TABLE "ServizioEffettuato" ADD CONSTRAINT "ServizioEffettuato_servizioId_fkey" FOREIGN KEY ("servizioId") REFERENCES "Servizio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
