import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const servizi = await prisma.servizio.findMany({
      orderBy: { nome: 'asc' }
    })
    return NextResponse.json(servizi)
  } catch (error) {
    console.error('Errore nel recupero dei servizi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei servizi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, prezzoCliente, costoNetto, ivaPercent = 22 } = body

    if (!nome || !prezzoCliente || !costoNetto) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    const servizio = await prisma.servizio.create({
      data: {
        nome,
        prezzoCliente: parseFloat(prezzoCliente),
        costoNetto: parseFloat(costoNetto),
        ivaPercent: parseFloat(ivaPercent)
      }
    })

    return NextResponse.json(servizio, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione del servizio:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del servizio' },
      { status: 500 }
    )
  }
}