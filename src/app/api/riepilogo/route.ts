import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const turno = searchParams.get('turno')
    const sede = searchParams.get('sede')

    if (!data) {
      return NextResponse.json(
        { error: 'La data è obbligatoria' },
        { status: 400 }
      )
    }

    const startDate = new Date(data)
    const endDate = new Date(data)
    endDate.setDate(endDate.getDate() + 1)

    const whereClause: { createdAt: { gte: Date; lt: Date }; turno?: string; sede?: string } = {
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    }

    if (turno) {
      whereClause.turno = turno
    }

    if (sede && sede !== 'ENTRAMBE') {
      whereClause.sede = sede
    }
    // Se sede è 'ENTRAMBE', non aggiungiamo il filtro sede per includere entrambe le sedi

    // Recupera servizi effettuati
    const serviziEffettuati = await prisma.servizioEffettuato.findMany({
      where: whereClause,
      include: {
        servizio: true
      }
    })

    // Recupera spedizioni
    const spedizioni = await prisma.spedizione.findMany({
      where: whereClause
    })

    // Calcola totali servizi
    const totaliServizi = serviziEffettuati.reduce(
      (acc: { entrate: number; costi: number; guadagni: number; quantita: number }, servizio: typeof serviziEffettuati[0]) => {
        acc.entrate += servizio.prezzoCliente
        acc.costi += servizio.costoTotale
        acc.guadagni += servizio.guadagno
        acc.quantita += servizio.quantita
        return acc
      },
      { entrate: 0, costi: 0, guadagni: 0, quantita: 0 }
    )

    // Calcola totali spedizioni
    const totaliSpedizioni = spedizioni.reduce(
      (acc: { entrate: number; costi: number; guadagni: number; quantita: number }, spedizione: typeof spedizioni[0]) => {
        acc.entrate += spedizione.prezzoCliente
        acc.costi += spedizione.rimborsoSpese
        acc.guadagni += spedizione.guadagno
        acc.quantita += 1
        return acc
      },
      { entrate: 0, costi: 0, guadagni: 0, quantita: 0 }
    )

    // Calcola totali per metodo di pagamento - SERVIZI
    const pagamentiServizi = serviziEffettuati.reduce(
      (acc: { contanti: number; pos: number }, servizio: typeof serviziEffettuati[0]) => {
        if (servizio.metodoPagamento === 'CONTANTI') {
          acc.contanti += servizio.prezzoCliente
        } else if (servizio.metodoPagamento === 'POS') {
          acc.pos += servizio.prezzoCliente
        }
        return acc
      },
      { contanti: 0, pos: 0 }
    )

    // Calcola totali per metodo di pagamento - SPEDIZIONI
    const pagamentiSpedizioni = spedizioni.reduce(
      (acc: { contanti: number; pos: number }, spedizione: typeof spedizioni[0]) => {
        if (spedizione.metodoPagamento === 'CONTANTI') {
          acc.contanti += spedizione.prezzoCliente
        } else if (spedizione.metodoPagamento === 'POS') {
          acc.pos += spedizione.prezzoCliente
        }
        return acc
      },
      { contanti: 0, pos: 0 }
    )

    // Calcola spese operative (rimborsi spedizioni)
    const speseOperative = spedizioni.reduce(
      (acc: number, spedizione: typeof spedizioni[0]) => {
        return acc + spedizione.rimborsoSpese
      },
      0
    )

    // Totali complessivi
    const totali = {
      entrate: totaliServizi.entrate + totaliSpedizioni.entrate,
      costi: totaliServizi.costi + totaliSpedizioni.costi,
      guadagni: totaliServizi.guadagni + totaliSpedizioni.guadagni
    }

    const riepilogo = {
      data,
      turno,
      servizi: {
        lista: serviziEffettuati,
        totali: totaliServizi
      },
      spedizioni: {
        lista: spedizioni,
        totali: totaliSpedizioni
      },
      totali,
      pagamenti: {
        servizi: pagamentiServizi,
        spedizioni: pagamentiSpedizioni,
        totaliContanti: pagamentiServizi.contanti + pagamentiSpedizioni.contanti,
        totaliPos: pagamentiServizi.pos + pagamentiSpedizioni.pos
      },
      speseOperative: {
        fabioBusta: speseOperative,
        descrizione: "Spese operative per rimborsi spedizioni Poste Italiane"
      }
    }

    return NextResponse.json(riepilogo)
  } catch (error) {
    console.error('Errore nel calcolo del riepilogo:', error)
    return NextResponse.json(
      { error: 'Errore nel calcolo del riepilogo' },
      { status: 500 }
    )
  }
}