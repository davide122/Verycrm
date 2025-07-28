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

    if (!nome || prezzoCliente === undefined || prezzoCliente === null || costoNetto === undefined || costoNetto === null) {
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nome, prezzoCliente, costoNetto, ivaPercent } = body

    if (!id || !nome || prezzoCliente === undefined || prezzoCliente === null || costoNetto === undefined || costoNetto === null) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    const servizio = await prisma.servizio.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        prezzoCliente: parseFloat(prezzoCliente),
        costoNetto: parseFloat(costoNetto),
        ivaPercent: parseFloat(ivaPercent)
      }
    })

    return NextResponse.json(servizio)
  } catch (error) {
    console.error('Errore nell\'aggiornamento del servizio:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del servizio' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID servizio mancante' },
        { status: 400 }
      )
    }

    await prisma.servizio.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Servizio eliminato con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione del servizio:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del servizio' },
      { status: 500 }
    )
  }
}