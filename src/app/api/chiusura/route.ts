import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tipoChiusura, 
      sede, 
      contantiTotali, 
      riepilogo, 
      calcoloSaldo 
    } = body

    // Salva la chiusura nel database usando il modello esistente
    const chiusura = await prisma.chiusura.create({
      data: {
        data: new Date(),
        turno: tipoChiusura,
        totaleEntrate: riepilogo.totaleGuadagni,
        totaleCosti: riepilogo.totaleCosti,
        totaleGuadagni: riepilogo.profittoNetto,
        chiuso: true
      }
    })

    // Log dettagliato per tracking
    console.log('Chiusura completata:', {
      id: chiusura.id,
      tipo: tipoChiusura,
      sede: sede,
      contantiTotali: contantiTotali,
      contantiServizi: riepilogo.pagamenti.servizi.contanti,
      contantiSpedizioni: riepilogo.pagamenti.spedizioni.contanti,
      posServizi: riepilogo.pagamenti.servizi.pos,
      posSpedizioni: riepilogo.pagamenti.spedizioni.pos,
      saldoDroppointCalcolato: calcoloSaldo.saldoCalcolato,
      saldoDroppointEffettivo: calcoloSaldo.saldoDroppointEffettivo,
      differenzaSaldo: calcoloSaldo.differenza,
      corrispondenzaSaldo: calcoloSaldo.corrispondenza,
      speseOperative: riepilogo.speseOperative.fabioBusta
    })

    return NextResponse.json({ 
      success: true, 
      chiusura,
      message: `Chiusura ${tipoChiusura} completata con successo per ${sede}` 
    })
  } catch (error) {
    console.error('Errore nella chiusura:', error)
    return NextResponse.json(
      { error: 'Errore durante la chiusura' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const turno = searchParams.get('turno')
    const sede = searchParams.get('sede')

    if (!data || !sede) {
      return NextResponse.json(
        { error: 'Data e sede sono obbligatori' },
        { status: 400 }
      )
    }

    // Costruisci la clausola WHERE per filtrare per data e sede
    const whereClause: {
      sede: string
      createdAt: {
        gte: Date
        lt: Date
      }
      turno?: string
    } = {
      sede: sede,
      createdAt: {
        gte: new Date(`${data}T00:00:00.000Z`),
        lt: new Date(`${data}T23:59:59.999Z`)
      }
    }

    // Aggiungi filtro turno se specificato
    if (turno && turno !== 'all') {
      whereClause.turno = turno
    }

    // Recupera tutti i servizi effettuati per la data/turno/sede
    const servizi = await prisma.servizioEffettuato.findMany({
      where: whereClause,
      include: {
        servizio: true
      }
    })

    // Calcola le entrate per tipologia di servizio
    const entrateServizi = {
      droppoint: 0,
      mooney: 0,
      ria: 0,
      altri: 0
    }

    servizi.forEach(servizio => {
      const nomeServizio = servizio.servizio.nome.toLowerCase()
      const entrata = servizio.prezzoCliente

      if (nomeServizio.includes('droppoint') || nomeServizio.includes('drop point')) {
        entrateServizi.droppoint += entrata
      } else if (nomeServizio.includes('mooney')) {
        entrateServizi.mooney += entrata
      } else if (nomeServizio.includes('ria')) {
        entrateServizi.ria += entrata
      } else {
        entrateServizi.altri += entrata
      }
    })

    // Recupera le spedizioni per la stessa data/turno/sede
    const spedizioni = await prisma.spedizione.findMany({
      where: whereClause
    })

    // Calcola entrate dalle spedizioni distribuite per categoria
    const entrateSpedizioni = {
      droppoint: 0,
      mooney: 0,
      ria: 0,
      altri: 0
    }

    // Distribuisci le spedizioni tra le categorie in base al peso e tipo
    spedizioni.forEach(spedizione => {
      const entrata = spedizione.prezzoCliente
      
      // Logica di categorizzazione delle spedizioni:
      // - Spedizioni leggere (< 2kg) -> droppoint
      // - Spedizioni medie (2-10kg) -> mooney  
      // - Spedizioni pesanti (> 10kg) -> altri
      // - RIA non applicabile per spedizioni
      
      if (spedizione.peso < 2) {
        entrateSpedizioni.droppoint += entrata
      } else if (spedizione.peso <= 10) {
        entrateSpedizioni.mooney += entrata
      } else {
        entrateSpedizioni.altri += entrata
      }
    })

    // Calcola i totali
    const totali = {
      droppoint: entrateServizi.droppoint + entrateSpedizioni.droppoint,
      mooney: entrateServizi.mooney + entrateSpedizioni.mooney,
      ria: entrateServizi.ria + entrateSpedizioni.ria,
      altri: entrateServizi.altri + entrateSpedizioni.altri
    }

    // Prepara la risposta con la struttura per i calcoli
    const response = {
      data,
      turno,
      sede,
      servizi: entrateServizi,
      spedizioni: entrateSpedizioni,
      totali: totali
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Errore nel recupero dati chiusura:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}