-- AlterTable
ALTER TABLE "Spedizione" ADD COLUMN     "metodoPagamento" "MetodoPagamento" NOT NULL DEFAULT 'CONTANTI',
ADD COLUMN     "quantitaImballaggi" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "quantitaPellicole" INTEGER NOT NULL DEFAULT 1;
