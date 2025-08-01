import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMonthlyReport } from '@/lib/pdfGenerator'

interface ServizioEffettuato {
  id: string
  servizioId: number
  quantita: number
  prezzoCliente: number
  costoTotale: number
  guadagno: number
  turno: string
  sede: string
  createdAt: string
  servizio: {
    nome: string
  }
}

interface Spedizione {
  id: string
  peso: number
  prezzoCliente: number
  guadagno: number
  rimborsoSpese: number
}

interface DayData {
  data: string
  servizi: ServizioEffettuato[]
  spedizioni: Spedizione[]
  totaliGiorno: {
    entrate: number
    guadagni: number
    operazioni: number
  }
}

interface SedeInfo {
  id: string
  nome: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // formato YYYY-MM
    const sedeId = searchParams.get('sede')

    if (!month || !sedeId) {
      return NextResponse.json(
        { error: 'Parametri month e sede sono richiesti' },
        { status: 400 }
      )
    }

    // Validazione formato mese
    const monthRegex = /^\d{4}-\d{2}$/
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: 'Formato mese non valido. Utilizzare YYYY-MM' },
        { status: 400 }
      )
    }

    // Calcola date di inizio e fine mese
    const startDate = new Date(`${month}-01T00:00:00.000Z`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999)

    // Informazioni sede (hardcoded poiché non c'è un modello Sede nel database)
    const sediInfo: Record<string, SedeInfo> = {
      'aragona': { id: 'aragona', nome: 'Aragona' },
      'porto-empedocle': { id: 'porto-empedocle', nome: 'Porto Empedocle' }
    }

    const sede = sediInfo[sedeId]
    if (!sede) {
      return NextResponse.json(
        { error: 'Sede non trovata' },
        { status: 404 }
      )
    }

    // Recupera tutti i servizi effettuati del mese
    const servizi = await prisma.servizioEffettuato.findMany({
      where: {
        sede: sedeId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        servizio: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Recupera tutte le spedizioni del mese
    const spedizioni = await prisma.spedizione.findMany({
      where: {
        sede: sedeId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calcola totali servizi
    const totaliServizi = servizi.reduce(
      (acc, servizio) => {
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
      (acc, spedizione) => {
        acc.entrate += spedizione.prezzoCliente
        acc.costi += spedizione.prezzoCliente - spedizione.guadagno - spedizione.rimborsoSpese
        acc.guadagni += spedizione.guadagno
        acc.quantita += 1
        return acc
      },
      { entrate: 0, costi: 0, guadagni: 0, quantita: 0 }
    )

    // Calcola pagamenti
    const pagamentiServizi = servizi.reduce(
      (acc, servizio) => {
        if (servizio.metodoPagamento === 'CONTANTI') {
          acc.contanti += servizio.prezzoCliente
        } else {
          acc.pos += servizio.prezzoCliente
        }
        return acc
      },
      { contanti: 0, pos: 0 }
    )

    const pagamentiSpedizioni = spedizioni.reduce(
      (acc, spedizione) => {
        if (spedizione.metodoPagamento === 'CONTANTI') {
          acc.contanti += spedizione.prezzoCliente
        } else {
          acc.pos += spedizione.prezzoCliente
        }
        return acc
      },
      { contanti: 0, pos: 0 }
    )

    // Raggruppa per giorno
    const giorniMap = new Map<string, DayData>()

    // Aggiungi servizi
    servizi.forEach(servizio => {
      const giorno = servizio.createdAt.toISOString().split('T')[0]
      if (!giorniMap.has(giorno)) {
        giorniMap.set(giorno, {
          data: giorno,
          servizi: [],
          spedizioni: [],
          totaliGiorno: { entrate: 0, guadagni: 0, operazioni: 0 }
        })
      }
      const giornoData = giorniMap.get(giorno)!
      giornoData.servizi.push({
        id: servizio.id.toString(),
        servizioId: servizio.servizioId,
        quantita: servizio.quantita,
        prezzoCliente: servizio.prezzoCliente,
        costoTotale: servizio.costoTotale,
        guadagno: servizio.guadagno,
        turno: servizio.turno,
        sede: servizio.sede,
        createdAt: servizio.createdAt.toISOString(),
        servizio: {
          nome: servizio.servizio.nome
        }
      })
      giornoData.totaliGiorno.entrate += servizio.prezzoCliente
      giornoData.totaliGiorno.guadagni += servizio.guadagno
      giornoData.totaliGiorno.operazioni += servizio.quantita
    })

    // Aggiungi spedizioni
    spedizioni.forEach(spedizione => {
      const giorno = spedizione.createdAt.toISOString().split('T')[0]
      if (!giorniMap.has(giorno)) {
        giorniMap.set(giorno, {
          data: giorno,
          servizi: [],
          spedizioni: [],
          totaliGiorno: { entrate: 0, guadagni: 0, operazioni: 0 }
        })
      }
      const giornoData = giorniMap.get(giorno)!
      giornoData.spedizioni.push({
        id: spedizione.id.toString(),
        peso: spedizione.peso,
        prezzoCliente: spedizione.prezzoCliente,
        guadagno: spedizione.guadagno,
        rimborsoSpese: spedizione.rimborsoSpese
      })
      giornoData.totaliGiorno.entrate += spedizione.prezzoCliente
      giornoData.totaliGiorno.guadagni += spedizione.guadagno
      giornoData.totaliGiorno.operazioni += 1
    })

    const giorniArray = Array.from(giorniMap.values()).sort((a, b) => a.data.localeCompare(b.data))

    const reportData = {
      mese: month,
      sede,
      giorni: giorniArray,
      totali: {
        servizi: totaliServizi,
        spedizioni: totaliSpedizioni,
        generali: {
          entrate: totaliServizi.entrate + totaliSpedizioni.entrate,
          guadagni: totaliServizi.guadagni + totaliSpedizioni.guadagni,
          operazioni: totaliServizi.quantita + totaliSpedizioni.quantita
        }
      },
      pagamenti: {
        servizi: pagamentiServizi,
        spedizioni: pagamentiSpedizioni,
        totali: {
          contanti: pagamentiServizi.contanti + pagamentiSpedizioni.contanti,
          pos: pagamentiServizi.pos + pagamentiSpedizioni.pos
        }
      }
    }

    // Genera PDF
    const pdfBuffer = await generateMonthlyReport(reportData)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report_mensile_${month}_${sede.nome.replace(/\s+/g, '_')}.pdf"`
      }
    })

  } catch (error) {
    console.error('Errore nella generazione del report mensile:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}