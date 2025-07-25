const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mappatura tra i servizi string e gli ID numerici del database
const SERVIZIO_MAPPING = {
  'SPID': 1, // Servizio SPID
  'MODULI': 3, // Pratica Amministrativa
  'ENERGIA': 2, // Contratto Energia
  'VISURA': 4, // Visura Camerale
  'CERTIFICATO': 5, // Certificato Anagrafico
  'RACCOMANDATA': 6, // Raccomandata A/R
  'FOTOCOPIE': 7, // Fotocopie
  'STAMPA': 8 // Stampa Documenti
}

async function main() {
  try {
    console.log('=== AGGIORNAMENTO DATI SERVIZI EFFETTUATI ===')
    
    // Prima, ottieni tutti i servizi effettuati con servizioId string
    const result = await prisma.$queryRaw`
      SELECT id, "servizioId" FROM "ServizioEffettuato" 
      WHERE "servizioId" ~ '^[A-Za-z]+$'
    `
    
    console.log('Servizi da aggiornare:', result)
    
    // Aggiorna ogni record
    for (const record of result) {
      const stringId = record.servizioId
      const numericId = SERVIZIO_MAPPING[stringId]
      
      if (numericId) {
        console.log(`Aggiornando ${record.id}: ${stringId} -> ${numericId}`)
        await prisma.$executeRaw`
          UPDATE "ServizioEffettuato" 
          SET "servizioId" = ${numericId}::text
          WHERE id = ${record.id}
        `
      } else {
        console.log(`ATTENZIONE: Nessuna mappatura trovata per ${stringId}`)
      }
    }
    
    console.log('Aggiornamento completato!')
    
  } catch (error) {
    console.error('Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()