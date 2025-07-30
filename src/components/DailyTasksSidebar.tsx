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
}

export default function DailyTasksSidebar() {
  const { currentSede } = useSede()
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

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

  // Organizza i task per ora
  const tasksByHour = useMemo(() => {
    const result: Record<string, TodoTask[]> = {}
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Filtra solo i task di oggi che non sono completati o annullati
    const relevantTasks = tasks.filter(task => {
      const isToday = task.dataScadenza?.startsWith(today)
      const isActive = task.stato === 'DA_FARE' || task.stato === 'IN_CORSO'
      return isToday && isActive
    })
    
    // Raggruppa per ora di inizio
    relevantTasks.forEach(task => {
      if (task.orarioInizio) {
        const hour = task.orarioInizio.substring(0, 2) // Estrae l'ora (es. "09" da "09:30")
        if (!result[hour]) {
          result[hour] = []
        }
        result[hour].push(task)
      } else {
        // Task senza orario specifico vanno in una categoria separata
        if (!result['--']) {
          result['--'] = []
        }
        result['--'].push(task)
      }
    })
    
    return result
  }, [tasks])

  // Ottieni le ore ordinate
  const sortedHours = useMemo(() => {
    return Object.keys(tasksByHour).sort((a, b) => {
      if (a === '--') return 1 // Metti i task senza orario alla fine
      if (b === '--') return -1
      return a.localeCompare(b)
    })
  }, [tasksByHour])

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

  // Formatta l'ora per la visualizzazione
  const formatHour = (hour: string) => {
    if (hour === '--') return 'Senza orario'
    return `${hour}:00`
  }

  // Conta il numero totale di task attivi oggi
  const activeTodayTasksCount = useMemo(() => {
    return sortedHours.reduce((count, hour) => count + tasksByHour[hour].length, 0)
  }, [sortedHours, tasksByHour])

  if (isLoading || !currentSede) {
    return null
  }

  return (
    <div className={`fixed right-0 top-16 z-40 transition-all duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}`}>
      {/* Pulsante per aprire/chiudere la sidebar */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-blue-600 text-white p-2 rounded-l-md shadow-md hover:bg-blue-700 transition-colors"
      >
        <div className="flex flex-col items-center">
          <ListTodo className="h-5 w-5" />
          <span className="text-xs mt-1">{activeTodayTasksCount}</span>
        </div>
      </button>
      
      {/* Contenuto della sidebar */}
      <Card className="w-80 max-h-[calc(100vh-5rem)] overflow-hidden shadow-xl border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Impegni di Oggi
            </CardTitle>
            <Badge className="bg-white text-blue-700">{activeTodayTasksCount}</Badge>
          </div>
          <div className="text-sm text-blue-100">
            {format(new Date(), 'EEEE d MMMM', { locale: it })}
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {activeTodayTasksCount > 0 ? (
            <div className="divide-y divide-gray-100">
              {sortedHours.map(hour => (
                <div key={hour} className="p-3">
                  <div className="font-medium text-sm text-gray-500 mb-2">
                    {formatHour(hour)}
                  </div>
                  <div className="space-y-2">
                    {tasksByHour[hour].map(task => (
                      <div 
                        key={task.id} 
                        className={`p-2 rounded-md border ${getPriorityColor(task.priorita)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm">{task.titolo}</div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.stato)}
                          </div>
                        </div>
                        {task.orarioInizio && (
                          <div className="text-xs mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.orarioInizio.substring(0, 5)}
                            {task.orarioFine && ` - ${task.orarioFine.substring(0, 5)}`}
                          </div>
                        )}
                        {task.assegnatoA && (
                          <div className="text-xs mt-1 text-gray-600">
                            Assegnato a: {task.assegnatoA}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>Nessun impegno per oggi</p>
            </div>
          )}
        </CardContent>
        
        <div className="p-3 bg-gray-50 border-t border-gray-100">
          <Link href="/todolist">
            <Button variant="outline" className="w-full flex justify-between items-center">
              <span>Visualizza tutti</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}