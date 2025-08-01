import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTurnoCorrente, calcolaPrezzo } from '@/lib/utils'

// PUT - Modifica una spedizione
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()
    const { peso, pellicola = false, quantitaPellicole = 1, imballaggio = false, quantitaImballaggi = 1, metodoPagamento = 'CONTANTI', sede, nominativoMittente } = body

    if (!peso || !sede) {
      return NextResponse.json(
        { error: 'Peso e sede sono obbligatori' },
        { status: 400 }
      )
    }

    if (metodoPagamento && !['CONTANTI', 'POS'].includes(metodoPagamento)) {
      return NextResponse.json(
        { error: 'Metodo di pagamento non valido' },
        { status: 400 }
      )
    }

    // Verifica che la spedizione esista
    const spedizioneEsistente = await prisma.spedizione.findUnique({
      where: { id }
    })

    if (!spedizioneEsistente) {
      return NextResponse.json(
        { error: 'Spedizione non trovata' },
        { status: 404 }
      )
    }

    // Calcola i prezzi aggiornati usando la funzione utility
    const prezzi = calcolaPrezzo(parseFloat(peso), pellicola, imballaggio, quantitaPellicole, quantitaImballaggi)

    const spedizioneAggiornata = await prisma.spedizione.update({
      where: { id },
      data: {
        peso: parseFloat(peso),
        pellicola,
        quantitaPellicole: pellicola ? quantitaPellicole : 1,
        imballaggio,
        quantitaImballaggi: imballaggio ? quantitaImballaggi : 1,
        prezzoPoste: prezzi.poste,
        iva: prezzi.iva,
        rimborsoSpese: prezzi.rimborso,
        prezzoCliente: prezzi.cliente,
        guadagno: prezzi.guadagno,
        sede: sede,
        metodoPagamento: metodoPagamento || 'CONTANTI',
        nominativoMittente: nominativoMittente || null
      }
    })

    return NextResponse.json(spedizioneAggiornata)
  } catch (error) {
    console.error('Errore nella modifica della spedizione:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina una spedizione
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    // Verifica che la spedizione esista
    const spedizioneEsistente = await prisma.spedizione.findUnique({
      where: { id }
    })

    if (!spedizioneEsistente) {
      return NextResponse.json(
        { error: 'Spedizione non trovata' },
        { status: 404 }
      )
    }

    await prisma.spedizione.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Spedizione eliminata con successo' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Errore nell\'eliminazione della spedizione:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}