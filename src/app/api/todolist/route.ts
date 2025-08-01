import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/todolist - Ottiene tutti i task per una data e sede specifiche
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const data = searchParams.get('data')
    const sede = searchParams.get('sede')

    console.log('GET /api/todolist - Parametri ricevuti:', { data, sede })

    if (!data || !sede) {
      console.error('GET /api/todolist - Parametri mancanti:', { data, sede })
      return NextResponse.json({ error: 'Data e sede sono parametri obbligatori' }, { status: 400 })
    }

    // Crea oggetti Date per l'inizio e la fine della giornata
    const dataInizio = new Date(data)
    dataInizio.setHours(0, 0, 0, 0)
    
    const dataFine = new Date(data)
    dataFine.setHours(23, 59, 59, 999)

    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)

    // Cerca i task per la data e sede specificate
    const tasks = await prisma.todoTask.findMany({
      where: {
        sede: sede,
        stato: {
          not: 'COMPLETATO'
        },
        OR: [
          // Task senza data di scadenza
          { dataScadenza: null },
          // Task con data di scadenza nella giornata specificata
          {
            dataScadenza: {
              gte: dataInizio,
              lte: dataFine
            }
          },
          // Task scaduti (data di scadenza precedente a oggi) che non sono completati
          {
            dataScadenza: {
              lt: oggi
            },
            stato: {
              in: ['DA_FARE', 'IN_CORSO']
            }
          }
        ]
      },
      orderBy: [
        { priorita: 'desc' },
        { dataScadenza: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Aggiungi un flag per identificare i task scaduti
    const tasksConFlag = tasks.map(task => {
      const isScaduto = task.dataScadenza && new Date(task.dataScadenza) < oggi && task.stato !== 'COMPLETATO'
      return {
        ...task,
        isScaduto: isScaduto || false,
        // Aumenta la priorità dei task scaduti
        prioritaEffettiva: isScaduto ? task.priorita + 100 : task.priorita
      }
    })

    // Riordina considerando i task scaduti
    tasksConFlag.sort((a, b) => {
      // Prima i task scaduti
      if (a.isScaduto && !b.isScaduto) return -1
      if (!a.isScaduto && b.isScaduto) return 1
      
      // Poi per priorità effettiva
      if (a.prioritaEffettiva !== b.prioritaEffettiva) {
        return b.prioritaEffettiva - a.prioritaEffettiva
      }
      
      // Infine per data di scadenza
      if (a.dataScadenza && b.dataScadenza) {
        return new Date(a.dataScadenza).getTime() - new Date(b.dataScadenza).getTime()
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log('GET /api/todolist - Task trovati:', tasksConFlag.length)
    return NextResponse.json(tasksConFlag)
  } catch (error) {
    console.error('Errore nella richiesta GET /api/todolist:', error)
    return NextResponse.json({ 
      error: 'Errore interno del server', 
      message: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 })
  }
}

// POST /api/todolist - Crea un nuovo task
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/todolist - Inizio elaborazione')
    
    // Verifica che prisma sia definito
    if (!prisma) {
      console.error('POST /api/todolist - Client Prisma non inizializzato')
      return NextResponse.json({ error: 'Database non disponibile' }, { status: 500 })
    }
    
    const body = await request.json()
    console.log('POST /api/todolist - Body ricevuto:', body)
    
    // Validazione dei campi obbligatori
    if (!body.titolo || !body.sede) {
      return NextResponse.json({ error: 'Titolo e sede sono campi obbligatori' }, { status: 400 })
    }

    // Preparazione dei dati per il database
    const taskData: Prisma.TodoTaskCreateInput = {
      titolo: body.titolo,
      descrizione: body.descrizione || null,
      sede: body.sede,
      priorita: body.priorita || 0,
      assegnatoA: body.assegnatoA || null,
      stato: 'DA_FARE',
    }

    // Gestione delle date e orari
    if (body.dataScadenza) {
      taskData.dataScadenza = new Date(body.dataScadenza)
    }

    if (body.orarioInizio) {
      // Se c'è solo l'orario, combiniamo con la data di scadenza o la data corrente
      const baseDate = body.dataScadenza ? new Date(body.dataScadenza) : new Date()
      const [hours, minutes] = body.orarioInizio.split(':').map(Number)
      
      const orarioInizio = new Date(baseDate)
      orarioInizio.setHours(hours, minutes, 0, 0)
      
      taskData.orarioInizio = orarioInizio
    }

    if (body.orarioFine) {
      // Se c'è solo l'orario, combiniamo con la data di scadenza o la data corrente
      const baseDate = body.dataScadenza ? new Date(body.dataScadenza) : new Date()
      const [hours, minutes] = body.orarioFine.split(':').map(Number)
      
      const orarioFine = new Date(baseDate)
      orarioFine.setHours(hours, minutes, 0, 0)
      
      taskData.orarioFine = orarioFine
    }

    // Creazione del task nel database
    console.log('POST /api/todolist - Dati preparati per la creazione:', taskData)
    
    let nuovoTask;
    try {
      nuovoTask = await prisma.todoTask.create({
        data: taskData
      })
      console.log('POST /api/todolist - Task creato con successo:', nuovoTask.id)
    } catch (dbError) {
      console.error('POST /api/todolist - Errore nella creazione del task:', dbError)
      return NextResponse.json({ 
        error: 'Errore nella creazione del task', 
        message: dbError instanceof Error ? dbError.message : 'Errore sconosciuto'
      }, { status: 500 })
    }

    return NextResponse.json(nuovoTask, { status: 201 })
  } catch (error) {
    console.error('Errore nella richiesta POST /api/todolist:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}