import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Ottieni saldo del giorno
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    
    if (!data) {
      return NextResponse.json({ error: 'Data richiesta' }, { status: 400 })
    }
    
    const dataObj = new Date(data)
    dataObj.setHours(0, 0, 0, 0)
    
    // Cerca il saldo del giorno
    let saldo = await prisma.saldoDroppoint.findUnique({
      where: { data: dataObj },
      include: {
        ricariche: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    // Se non esiste, crealo con saldo iniziale 0
    if (!saldo) {
      saldo = await prisma.saldoDroppoint.create({
        data: {
          data: dataObj,
          saldoIniziale: 0
        },
        include: {
          ricariche: true
        }
      })
    }
    
    // Calcola il saldo totale con le ricariche
    const totaleRicariche = saldo.ricariche.reduce((sum, ricarica) => sum + ricarica.importo, 0)
    const saldoTotale = saldo.saldoIniziale + totaleRicariche
    
    return NextResponse.json({
      ...saldo,
      saldoTotale,
      totaleRicariche
    })
    
  } catch (error) {
    console.error('Errore nel recupero saldo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST - Aggiorna saldo iniziale o finale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, saldoIniziale, saldoFinale } = body
    
    if (!data) {
      return NextResponse.json({ error: 'Data richiesta' }, { status: 400 })
    }
    
    const dataObj = new Date(data)
    dataObj.setHours(0, 0, 0, 0)
    
    // Aggiorna o crea il saldo
    const saldo = await prisma.saldoDroppoint.upsert({
      where: { data: dataObj },
      update: {
        ...(saldoIniziale !== undefined && { saldoIniziale }),
        ...(saldoFinale !== undefined && { saldoFinale })
      },
      create: {
        data: dataObj,
        saldoIniziale: saldoIniziale || 0,
        ...(saldoFinale !== undefined && { saldoFinale })
      },
      include: {
        ricariche: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    // Calcola il saldo totale con le ricariche
    const totaleRicariche = saldo.ricariche.reduce((sum, ricarica) => sum + ricarica.importo, 0)
    const saldoTotale = saldo.saldoIniziale + totaleRicariche
    
    return NextResponse.json({
      ...saldo,
      saldoTotale,
      totaleRicariche
    })
    
  } catch (error) {
    console.error('Errore nell\'aggiornamento saldo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}