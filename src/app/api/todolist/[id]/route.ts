import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// PATCH /api/todolist/[id] - Aggiorna parzialmente un task (es. solo lo stato)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params
  try {
    console.log(`PATCH /api/todolist/${paramId} - Inizio elaborazione`)
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      console.error(`PATCH /api/todolist/${paramId} - ID non valido`)
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }
    
    const body = await request.json()
    console.log(`PATCH /api/todolist/${paramId} - Body ricevuto:`, body)

    // Verifica che il task esista
    const taskEsistente = await prisma.todoTask.findUnique({
      where: { id }
    })

    if (!taskEsistente) {
      console.error(`PATCH /api/todolist/${paramId} - Task non trovato`)
      return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
    }

    console.log(`PATCH /api/todolist/${paramId} - Task trovato, procedo con l'aggiornamento`)
    
    try {
      // Aggiornamento del task nel database
      const taskAggiornato = await prisma.todoTask.update({
        where: { id },
        data: body
      })
      
      console.log(`PATCH /api/todolist/${paramId} - Task aggiornato con successo:`, taskAggiornato.id)
      return NextResponse.json(taskAggiornato)
    } catch (dbError) {
      console.error(`PATCH /api/todolist/${paramId} - Errore nell'aggiornamento:`, dbError)
      return NextResponse.json({ 
        error: 'Errore nell\'aggiornamento del task', 
        message: dbError instanceof Error ? dbError.message : 'Errore sconosciuto'
      }, { status: 500 })
    }
  } catch (error) {
    console.error(`Errore nella richiesta PATCH /api/todolist/${paramId}:`, error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// GET /api/todolist/[id] - Ottiene un task specifico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params
  try {
    console.log(`GET /api/todolist/${paramId} - Inizio elaborazione`)
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      console.error(`GET /api/todolist/${paramId} - ID non valido`)
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    try {
      const task = await prisma.todoTask.findUnique({
        where: { id }
      })

      if (!task) {
        console.error(`GET /api/todolist/${paramId} - Task non trovato`)
        return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
      }
      
      console.log(`GET /api/todolist/${paramId} - Task trovato con successo`)
      return NextResponse.json(task)
    } catch (dbError) {
      console.error(`GET /api/todolist/${paramId} - Errore nella ricerca:`, dbError)
      return NextResponse.json({ 
        error: 'Errore nella ricerca del task', 
        message: dbError instanceof Error ? dbError.message : 'Errore sconosciuto'
      }, { status: 500 })
    }
  } catch (error) {
    console.error(`Errore nella richiesta GET /api/todolist/${paramId}:`, error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// PUT /api/todolist/[id] - Aggiorna un task esistente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params
  try {
    console.log(`PUT /api/todolist/${paramId} - Inizio elaborazione`)
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      console.error(`PUT /api/todolist/${paramId} - ID non valido`)
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }
    
    const body = await request.json()
    console.log(`PUT /api/todolist/${paramId} - Body ricevuto:`, body)

    // Verifica che il task esista
    const taskEsistente = await prisma.todoTask.findUnique({
      where: { id }
    })

    if (!taskEsistente) {
      console.error(`PUT /api/todolist/${paramId} - Task non trovato`)
      return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
    }
    
    console.log(`PUT /api/todolist/${paramId} - Task trovato, procedo con l'aggiornamento`)

    // Preparazione dei dati per l'aggiornamento
    const taskData: Record<string, unknown> = {
      titolo: body.titolo !== undefined ? body.titolo : taskEsistente.titolo,
      descrizione: body.descrizione !== undefined ? body.descrizione : taskEsistente.descrizione,
      sede: body.sede !== undefined ? body.sede : taskEsistente.sede,
      priorita: body.priorita !== undefined ? body.priorita : taskEsistente.priorita,
      assegnatoA: body.assegnatoA !== undefined ? body.assegnatoA : taskEsistente.assegnatoA,
      stato: body.stato !== undefined ? body.stato : taskEsistente.stato,
    }

    // Gestione delle date e orari
    if (body.dataScadenza !== undefined) {
      taskData.dataScadenza = body.dataScadenza ? new Date(body.dataScadenza) : null
    }

    if (body.orarioInizio !== undefined) {
      if (body.orarioInizio) {
        // Se c'è solo l'orario, combiniamo con la data di scadenza o la data corrente
        const baseDate = (taskData.dataScadenza as Date) || taskEsistente.dataScadenza || new Date()
        const [hours, minutes] = body.orarioInizio.split(':').map(Number)
        
        const orarioInizio = new Date(baseDate)
        orarioInizio.setHours(hours, minutes, 0, 0)
        
        taskData.orarioInizio = orarioInizio
      } else {
        taskData.orarioInizio = null
      }
    }

    if (body.orarioFine !== undefined) {
      if (body.orarioFine) {
        // Se c'è solo l'orario, combiniamo con la data di scadenza o la data corrente
        const baseDate = (taskData.dataScadenza as Date) || taskEsistente.dataScadenza || new Date()
        const [hours, minutes] = body.orarioFine.split(':').map(Number)
        
        const orarioFine = new Date(baseDate)
        orarioFine.setHours(hours, minutes, 0, 0)
        
        taskData.orarioFine = orarioFine
      } else {
        taskData.orarioFine = null
      }
    }

    // Aggiornamento del task nel database
    try {
      const taskAggiornato = await prisma.todoTask.update({
        where: { id },
        data: taskData
      })
      
      console.log(`PUT /api/todolist/${paramId} - Task aggiornato con successo:`, taskAggiornato.id)
      return NextResponse.json(taskAggiornato)
    } catch (dbError) {
      console.error(`PUT /api/todolist/${paramId} - Errore nell'aggiornamento:`, dbError)
      return NextResponse.json({ 
        error: 'Errore nell\'aggiornamento del task', 
        message: dbError instanceof Error ? dbError.message : 'Errore sconosciuto'
      }, { status: 500 })
    }
  } catch (error) {
    console.error(`Errore nella richiesta PUT /api/todolist/${paramId}:`, error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// DELETE /api/todolist/[id] - Elimina un task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params
  try {
    console.log(`DELETE /api/todolist/${paramId} - Inizio elaborazione`)
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      console.error(`DELETE /api/todolist/${paramId} - ID non valido`)
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    // Verifica che il task esista
    const taskEsistente = await prisma.todoTask.findUnique({
      where: { id }
    })

    if (!taskEsistente) {
      console.error(`DELETE /api/todolist/${paramId} - Task non trovato`)
      return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
    }
    
    console.log(`DELETE /api/todolist/${paramId} - Task trovato, procedo con l'eliminazione`)

    // Eliminazione del task
    try {
      await prisma.todoTask.delete({
        where: { id }
      })
      
      console.log(`DELETE /api/todolist/${paramId} - Task eliminato con successo`)
      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error(`DELETE /api/todolist/${paramId} - Errore nell'eliminazione:`, dbError)
      return NextResponse.json({ 
        error: 'Errore nell\'eliminazione del task', 
        message: dbError instanceof Error ? dbError.message : 'Errore sconosciuto'
      }, { status: 500 })
    }
  } catch (error) {
    console.error(`Errore nella richiesta DELETE /api/todolist/${paramId}:`, error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}