import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Ottieni ricariche per data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    
    if (!data) {
      return NextResponse.json({ error: 'Data richiesta' }, { status: 400 })
    }
    
    const dataObj = new Date(data)
    dataObj.setHours(0, 0, 0, 0)
    
    // Trova il saldo del giorno
    const saldo = await prisma.saldoDroppoint.findUnique({
      where: { data: dataObj },
      include: {
        ricariche: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!saldo) {
      return NextResponse.json({ ricariche: [] })
    }
    
    return NextResponse.json({ ricariche: saldo.ricariche })
    
  } catch (error) {
    console.error('Errore nel recupero ricariche:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST - Aggiungi ricarica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, importo, descrizione, turno, sede } = body
    
    if (!data || !importo || !turno || !sede) {
      return NextResponse.json({ 
        error: 'Data, importo, turno e sede sono richiesti' 
      }, { status: 400 })
    }
    
    const dataObj = new Date(data)
    dataObj.setHours(0, 0, 0, 0)
    
    // Assicurati che esista il saldo per il giorno
    let saldo = await prisma.saldoDroppoint.findUnique({
      where: { data: dataObj }
    })
    
    if (!saldo) {
      saldo = await prisma.saldoDroppoint.create({
        data: {
          data: dataObj,
          saldoIniziale: 0
        }
      })
    }
    
    // Crea la ricarica
    const ricarica = await prisma.ricaricaDroppoint.create({
      data: {
        saldoId: saldo.id,
        importo: parseFloat(importo),
        descrizione,
        turno,
        sede
      }
    })
    
    return NextResponse.json(ricarica)
    
  } catch (error) {
    console.error('Errore nella creazione ricarica:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// DELETE - Elimina ricarica
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID ricarica richiesto' }, { status: 400 })
    }
    
    await prisma.ricaricaDroppoint.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore nell\'eliminazione ricarica:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}