import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Cancella i dati esistenti
  await prisma.servizioEffettuato.deleteMany()
  await prisma.servizio.deleteMany()
  await prisma.spedizione.deleteMany()
  await prisma.chiusura.deleteMany()

  // Crea servizi di esempio
  const servizi = [
    {
      nome: 'SPID Attivazione',
      prezzoCliente: 15.00,
      costoNetto: 3.00,
      ivaPercent: 22
    },
    {
      nome: 'Contratto Energia',
      prezzoCliente: 25.00,
      costoNetto: 8.00,
      ivaPercent: 22
    },
    {
      nome: 'Pratica Amministrativa',
      prezzoCliente: 20.00,
      costoNetto: 5.00,
      ivaPercent: 22
    },
    {
      nome: 'Visura Camerale',
      prezzoCliente: 12.00,
      costoNetto: 4.00,
      ivaPercent: 22
    },
    {
      nome: 'Certificato Anagrafico',
      prezzoCliente: 8.00,
      costoNetto: 2.50,
      ivaPercent: 22
    },
    {
      nome: 'Raccomandata A/R',
      prezzoCliente: 7.50,
      costoNetto: 4.20,
      ivaPercent: 22
    },
    {
      nome: 'Fotocopie (per foglio)',
      prezzoCliente: 0.15,
      costoNetto: 0.02,
      ivaPercent: 22
    },
    {
      nome: 'Stampa Documenti',
      prezzoCliente: 0.50,
      costoNetto: 0.10,
      ivaPercent: 22
    }
  ]

  for (const servizio of servizi) {
    await prisma.servizio.create({
      data: servizio
    })
  }

  console.log('Database popolato con successo!')
  console.log(`Creati ${servizi.length} servizi di esempio`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })