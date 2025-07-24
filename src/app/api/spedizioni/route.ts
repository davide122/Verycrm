import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTurnoCorrente, calcolaPrezzo } from '@/lib/utils'

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

    const spedizioni = await prisma.spedizione.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(spedizioni)
  } catch (error) {
    console.error('Errore nel recupero delle spedizioni:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle spedizioni' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { peso, pellicola = false, imballaggio = false } = body

    if (!peso) {
      return NextResponse.json(
        { error: 'Il peso è obbligatorio' },
        { status: 400 }
      )
    }

    // Calcola i prezzi usando la funzione utility
    const prezzi = calcolaPrezzo(parseFloat(peso), pellicola, imballaggio)
    const turno = getTurnoCorrente()

    const spedizione = await prisma.spedizione.create({
      data: {
        peso: parseFloat(peso),
        pellicola,
        imballaggio,
        prezzoPoste: prezzi.poste,
        iva: prezzi.iva,
        rimborsoSpese: prezzi.rimborso,
        prezzoCliente: prezzi.cliente,
        guadagno: prezzi.guadagno,
        turno
      }
    })

    return NextResponse.json(spedizione, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione della spedizione:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della spedizione' },
      { status: 500 }
    )
  }
}