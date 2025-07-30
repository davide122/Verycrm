import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Modifica un servizio effettuato
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
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

    // Verifica che il servizio effettuato esista
    const servizioEsistente = await prisma.servizioEffettuato.findUnique({
      where: { id }
    })

    if (!servizioEsistente) {
      return NextResponse.json(
        { error: 'Servizio effettuato non trovato' },
        { status: 404 }
      )
    }

    // Recupera il servizio dal database per ricalcolare i prezzi
    const servizio = await prisma.servizio.findUnique({
      where: { id: parseInt(servizioId) }
    })

    if (!servizio) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    // Calcola i valori aggiornati
    const prezzoCliente = servizio.prezzoCliente * quantita
    const costoTotale = servizio.costoNetto * quantita
    const guadagno = prezzoCliente - costoTotale

    const servizioAggiornato = await prisma.servizioEffettuato.update({
      where: { id },
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

    return NextResponse.json(servizioAggiornato)
  } catch (error) {
    console.error('Errore nella modifica del servizio effettuato:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina un servizio effettuato
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    // Verifica che il servizio effettuato esista
    const servizioEsistente = await prisma.servizioEffettuato.findUnique({
      where: { id }
    })

    if (!servizioEsistente) {
      return NextResponse.json(
        { error: 'Servizio effettuato non trovato' },
        { status: 404 }
      )
    }

    await prisma.servizioEffettuato.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Servizio effettuato eliminato con successo' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Errore nell\'eliminazione del servizio effettuato:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}