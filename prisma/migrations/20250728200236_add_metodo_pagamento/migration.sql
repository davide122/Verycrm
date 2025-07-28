-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('CONTANTI', 'POS');

-- AlterTable
ALTER TABLE "ServizioEffettuato" ADD COLUMN     "metodoPagamento" "MetodoPagamento" NOT NULL DEFAULT 'CONTANTI';
