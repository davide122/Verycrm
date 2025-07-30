import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const sede = searchParams.get('sede')

    if (!sede) {
      return NextResponse.json(
        { error: 'Sede è richiesta' },
        { status: 400 }
      )
    }

    const whereClause: { sede: string; createdAt?: { gte: Date; lte: Date } } = { sede }

    if (data) {
      const targetDate = new Date(data)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const serviziEffettuati = await prisma.servizioEffettuato.findMany({
      where: whereClause,
      include: {
        servizio: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(serviziEffettuati)
  } catch (error) {
    console.error('Errore nel recupero dei servizi effettuati:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { servizioId, quantita, turno, sede, metodoPagamento } = await request.json()

    // Validazione dei dati
    if (!servizioId || !quantita || !turno || !sede) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    // Validazione metodo pagamento
    if (metodoPagamento && !['CONTANTI', 'POS'].includes(metodoPagamento)) {
      return NextResponse.json(
        { error: 'Metodo di pagamento non valido' },
        { status: 400 }
      )
    }

    // Recupera il servizio dal database
    const servizio = await prisma.servizio.findUnique({
      where: { id: parseInt(servizioId) }
    })

    if (!servizio) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    // Calcola i valori
    const prezzoCliente = servizio.prezzoCliente * quantita
    const costoTotale = servizio.costoNetto * quantita
    const guadagno = prezzoCliente - costoTotale

    const nuovoServizio = await prisma.servizioEffettuato.create({
      data: {
        servizioId: parseInt(servizioId),
        quantita,
        prezzoCliente,
        costoTotale,
        guadagno,
        turno,
        sede,
        metodoPagamento: metodoPagamento || 'CONTANTI'
      },
      include: {
        servizio: true
      }
    })

    return NextResponse.json(nuovoServizio, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione del servizio effettuato:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}