'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSede } from '@/hooks/useSede'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Clock, Calendar, CheckCircle, AlertCircle, X, ChevronRight, ListTodo } from 'lucide-react'
import Link from 'next/link'

// Definizione dei tipi
type StatoTask = 'DA_FARE' | 'IN_CORSO' | 'COMPLETATO' | 'ANNULLATO'

interface TodoTask {
  id: number
  titolo: string
  descrizione?: string
  dataScadenza?: string
  orarioInizio?: string
  orarioFine?: string
  stato: StatoTask
  priorita: number
  sede: string
  assegnatoA?: string
  createdAt: string
  updatedAt: string
  isScaduto?: boolean
  prioritaEffettiva?: number
}

export default function DailyTasksWidget() {
  const { currentSede } = useSede()
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carica i task del giorno corrente
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentSede) return
      
      try {
        setIsLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/todolist?data=${today}&sede=${currentSede.id}`)
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento delle attività')
        }
        
        const data = await response.json()
        setTasks(data)
      } catch (error) {
        console.error('Errore nel caricamento delle attività:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (currentSede) {
      fetchTasks()
      // Aggiorna ogni 5 minuti
      const interval = setInterval(fetchTasks, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentSede])

  // Filtra i task attivi (di oggi + scaduti)
  const activeTodayTasks = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    return tasks.filter(task => {
      const isToday = task.dataScadenza?.startsWith(today)
      const isActive = task.stato === 'DA_FARE' || task.stato === 'IN_CORSO'
      const isOverdue = task.isScaduto
      return (isToday || isOverdue) && isActive
    }).sort((a, b) => {
      // Prima i task scaduti
      if (a.isScaduto && !b.isScaduto) return -1
      if (!a.isScaduto && b.isScaduto) return 1
      
      // Poi ordina per orario di inizio
      if (a.orarioInizio && b.orarioInizio) {
        return a.orarioInizio.localeCompare(b.orarioInizio)
      }
      // Task con orario vengono prima di quelli senza
      if (a.orarioInizio && !b.orarioInizio) return -1
      if (!a.orarioInizio && b.orarioInizio) return 1
      // Infine ordina per priorità effettiva
      return (b.prioritaEffettiva || b.priorita) - (a.prioritaEffettiva || a.priorita)
    })
  }, [tasks])

  // Funzione per ottenere il colore in base alla priorità
  const getPriorityColor = (priorita: number) => {
    switch(priorita) {
      case 2: return 'bg-red-100 text-red-800 border-red-200'
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  // Funzione per ottenere l'icona in base allo stato
  const getStatusIcon = (stato: StatoTask) => {
    switch(stato) {
      case 'COMPLETATO': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'IN_CORSO': return <Clock className="h-4 w-4 text-blue-500" />
      case 'ANNULLATO': return <X className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  if (isLoading || !currentSede) {
    return (
      <Card className="w-full shadow-sm border-blue-200 animate-pulse">
        <CardHeader className="bg-gray-100 py-3 px-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-sm border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Impegni di Oggi
          </CardTitle>
          <Badge className="bg-white text-blue-700">{activeTodayTasks.length}</Badge>
        </div>
        <div className="text-sm text-blue-100">
          {format(new Date(), 'EEEE d MMMM', { locale: it })}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {activeTodayTasks.length > 0 ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activeTodayTasks.map(task => (
              <div 
                key={task.id} 
                className={`p-3 rounded-md border ${
                  task.isScaduto ? 'bg-red-50 border-red-300 text-red-900' : getPriorityColor(task.priorita)
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{task.titolo}</div>
                    {task.isScaduto && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        SCADUTO
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(task.stato)}
                  </div>
                </div>
                {task.orarioInizio && (
                  <div className="text-sm mt-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {task.orarioInizio.substring(0, 5)}
                    {task.orarioFine && ` - ${task.orarioFine.substring(0, 5)}`}
                  </div>
                )}
                {task.assegnatoA && (
                  <div className="text-sm mt-1 text-gray-600">
                    Assegnato a: {task.assegnatoA}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p>Nessun impegno per oggi</p>
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link href="/todolist">
            <Button variant="outline" className="w-full flex justify-between items-center">
              <span>Visualizza tutti gli impegni</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}