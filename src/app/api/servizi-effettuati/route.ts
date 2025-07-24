import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTurnoCorrente } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const turno = searchParams.get('turno')

    const whereClause: { createdAt?: { gte: Date; lt: Date }; turno?: string } = {}

    if (data) {
      const startDate = new Date(data)
      const endDate = new Date(data)
      endDate.setDate(endDate.getDate() + 1)
      
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate
      }
    }

    if (turno) {
      whereClause.turno = turno
    }

    const serviziEffettuati = await prisma.servizioEffettuato.findMany({
      where: whereClause,
      include: {
        servizio: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(serviziEffettuati)
  } catch (error) {
    console.error('Errore nel recupero dei servizi effettuati:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei servizi effettuati' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { servizioId, quantita } = body

    if (!servizioId || !quantita) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    // Recupera il servizio per calcolare i costi
    const servizio = await prisma.servizio.findUnique({
      where: { id: parseInt(servizioId) }
    })

    if (!servizio) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    // Calcoli
    const quantitaNum = parseInt(quantita)
    const prezzoCliente = servizio.prezzoCliente * quantitaNum
    const costoConIva = servizio.costoNetto * (1 + servizio.ivaPercent / 100)
    const costoTotale = costoConIva * quantitaNum
    const guadagno = prezzoCliente - costoTotale
    const turno = getTurnoCorrente()

    const servizioEffettuato = await prisma.servizioEffettuato.create({
      data: {
        servizioId: parseInt(servizioId),
        quantita: quantitaNum,
        prezzoCliente,
        costoTotale,
        guadagno,
        turno
      },
      include: {
        servizio: true
      }
    })

    return NextResponse.json(servizioEffettuato, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione del servizio effettuato:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del servizio effettuato' },
      { status: 500 }
    )
  }
}