const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('=== SERVIZI NEL DATABASE ===')
    const servizi = await prisma.servizio.findMany()
    console.log(servizi)
    
    console.log('\n=== SERVIZI EFFETTUATI ===')
    const serviziEffettuati = await prisma.servizioEffettuato.findMany()
    console.log(serviziEffettuati)
    
  } catch (error) {
    console.error('Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()