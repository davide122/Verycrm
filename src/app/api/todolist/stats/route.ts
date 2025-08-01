import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/todolist/stats - Ottiene statistiche sui task
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sede = searchParams.get('sede')

    if (!sede) {
      return NextResponse.json({ error: 'Sede è un parametro obbligatorio' }, { status: 400 })
    }

    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)

    // Conta i task per stato
    const taskPerStato = await prisma.todoTask.groupBy({
      by: ['stato'],
      where: {
        sede: sede
      },
      _count: {
        id: true
      }
    })

    // Conta i task scaduti
    const taskScaduti = await prisma.todoTask.count({
      where: {
        sede: sede,
        dataScadenza: {
          lt: oggi
        },
        stato: {
          in: ['DA_FARE', 'IN_CORSO']
        }
      }
    })

    // Conta i task di oggi
    const fineGiornata = new Date(oggi)
    fineGiornata.setHours(23, 59, 59, 999)

    const taskOggi = await prisma.todoTask.count({
      where: {
        sede: sede,
        dataScadenza: {
          gte: oggi,
          lte: fineGiornata
        },
        stato: {
          in: ['DA_FARE', 'IN_CORSO']
        }
      }
    })

    // Conta i task completati questa settimana
    const inizioSettimana = new Date(oggi)
    inizioSettimana.setDate(oggi.getDate() - oggi.getDay())
    inizioSettimana.setHours(0, 0, 0, 0)

    const taskCompletatiSettimana = await prisma.todoTask.count({
      where: {
        sede: sede,
        stato: 'COMPLETATO',
        updatedAt: {
          gte: inizioSettimana
        }
      }
    })

    // Task per priorità (solo attivi)
    const taskPerPriorita = await prisma.todoTask.groupBy({
      by: ['priorita'],
      where: {
        sede: sede,
        stato: {
          in: ['DA_FARE', 'IN_CORSO']
        }
      },
      _count: {
        id: true
      }
    })

    const stats = {
      perStato: taskPerStato.reduce((acc, item) => {
        acc[item.stato] = item._count.id
        return acc
      }, {} as Record<string, number>),
      scaduti: taskScaduti,
      oggi: taskOggi,
      completatiSettimana: taskCompletatiSettimana,
      perPriorita: taskPerPriorita.reduce((acc, item) => {
        acc[item.priorita] = item._count.id
        return acc
      }, {} as Record<number, number>),
      totaleAttivi: taskScaduti + taskOggi
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Errore nella richiesta GET /api/todolist/stats:', error)
    return NextResponse.json({ 
      error: 'Errore interno del server', 
      message: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 })
  }
}