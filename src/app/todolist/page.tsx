'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, Trash2, CheckCircle, AlertCircle, Calendar, ListTodo, MoreHorizontal, User, X } from 'lucide-react'
import { useSede } from '@/hooks/useSede'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

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

// Componente per visualizzare un singolo task card
const TaskCard = ({ task, onUpdateStatus, onDelete }: { 
  task: TodoTask, 
  onUpdateStatus: (id: number | string, status: StatoTask) => Promise<void>,
  onDelete: (id: number | string) => Promise<void> 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const getPriorityColor = (priorita: number) => {
    switch(priorita) {
      case 2: return 'bg-red-100 text-red-800'
      case 1: return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusOptions = () => {
    const options: {value: StatoTask, label: string}[] = [
      { value: 'DA_FARE', label: 'Da fare' },
      { value: 'IN_CORSO', label: 'In corso' },
      { value: 'COMPLETATO', label: 'Completato' },
      { value: 'ANNULLATO', label: 'Annullato' }
    ]
    
    return options.filter(option => option.value !== task.stato)
  }
  
  // Funzione per formattare l'orario
  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    const time = new Date(timeString)
    return format(time, 'HH:mm', { locale: it })
  }
  
  return (
    <Card className={`mb-2 sm:mb-3 shadow-sm hover:shadow-md transition-shadow border-l-4 ${
      task.isScaduto ? 'bg-red-50 border-red-500 shadow-red-100' : ''
    }`} 
      style={{ 
        borderLeftColor: task.isScaduto ? '#ef4444' : 
          task.priorita === 2 ? '#ef4444' : 
          task.priorita === 1 ? '#eab308' : '#9ca3af' 
      }}
    >
      <CardContent className="p-2 sm:p-3">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <h4 className={`font-medium text-sm sm:text-base truncate ${
              task.isScaduto ? 'text-red-900' : 'text-gray-900'
            }`}>{task.titolo}</h4>
            {task.isScaduto && (
              <Badge variant="destructive" className="text-xs px-1 py-0.5 sm:px-2 flex-shrink-0">
                <AlertCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">SCADUTO</span>
                <span className="sm:hidden">!</span>
              </Badge>
            )}
          </div>
          <div className="relative flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 sm:h-8 sm:w-8" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  {getStatusOptions().map((option) => (
                    <button
                      key={option.value}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        onUpdateStatus(task.id, option.value)
                        setIsMenuOpen(false)
                      }}
                    >
                      Sposta in {option.label}
                    </button>
                  ))}
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      if (confirm('Sei sicuro di voler eliminare questa attività?')) {
                        onDelete(task.id)
                      }
                      setIsMenuOpen(false)
                    }}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {task.descrizione && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.descrizione}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className={getPriorityColor(task.priorita)}>
            {task.priorita === 0 ? 'Bassa' : task.priorita === 1 ? 'Media' : 'Alta'}
          </Badge>
          
          {task.dataScadenza && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dataScadenza), 'dd/MM/yyyy')}
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          {task.assegnatoA ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assegnatoA}
            </span>
          ) : (
            <span></span>
          )}
          
          {(task.orarioInizio || task.orarioFine) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.orarioInizio && formatTime(task.orarioInizio)}
              {task.orarioInizio && task.orarioFine && ' - '}
              {task.orarioFine && formatTime(task.orarioFine)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente per visualizzare una colonna di task
const TaskColumn = ({ title, icon, tasks, onUpdateStatus, onDelete }: {
  title: string,
  icon: React.ReactNode,
  tasks: TodoTask[],
  onUpdateStatus: (id: number | string, status: StatoTask) => Promise<void>,
  onDelete: (id: number | string) => Promise<void>
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>
      
      <div className="flex-grow overflow-auto space-y-3 pr-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdateStatus={onUpdateStatus} 
              onDelete={onDelete} 
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 italic text-sm">
            Nessuna attività
          </div>
        )}
      </div>
    </div>
  )
}

// Componente per il form di creazione task
const TaskForm = ({ onSubmit, onCancel }: { 
  onSubmit: (task: {
    titolo: string;
    descrizione: string;
    dataScadenza: string;
    orarioInizio: string;
    orarioFine: string;
    priorita: number;
    sede: string;
  }) => Promise<void>, 
  onCancel: () => void 
}) => {
  const { currentSede } = useSede()
  const [task, setTask] = useState<{
    titolo: string
    descrizione: string
    dataScadenza: string
    orarioInizio: string
    orarioFine: string
    priorita: string
    assegnatoA: string
  }>({
    titolo: '',
    descrizione: '',
    dataScadenza: new Date().toISOString().split('T')[0],
    orarioInizio: '',
    orarioFine: '',
    priorita: '0',
    assegnatoA: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.titolo) {
      alert('Il titolo è obbligatorio')
      return
    }
    
    if (!currentSede?.id) {
      alert('Sede non selezionata')
      return
    }
    
    await onSubmit({
      ...task,
      priorita: parseInt(task.priorita),
      sede: currentSede.id
    })
  }

  return (
    <Card className="mb-6 bg-white border-blue-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-700">Nuova Attività</CardTitle>
        <CardDescription>Compila il form per aggiungere una nuova attività</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Titolo*</label>
              <Input 
                placeholder="Titolo dell'attività" 
                value={task.titolo}
                onChange={(e) => setTask({...task, titolo: e.target.value})}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Descrizione</label>
              <textarea 
                placeholder="Descrizione dettagliata" 
                value={task.descrizione}
                onChange={(e) => setTask({...task, descrizione: e.target.value})}
                className="w-full border border-blue-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Assegnato a</label>
              <Input 
                placeholder="Nome della persona" 
                value={task.assegnatoA}
                onChange={(e) => setTask({...task, assegnatoA: e.target.value})}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data Scadenza</label>
              <Input 
                type="date" 
                value={task.dataScadenza}
                onChange={(e) => setTask({...task, dataScadenza: e.target.value})}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Orario Inizio</label>
                <Input 
                  type="time" 
                  value={task.orarioInizio}
                  onChange={(e) => setTask({...task, orarioInizio: e.target.value})}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Orario Fine</label>
                <Input 
                  type="time" 
                  value={task.orarioFine}
                  onChange={(e) => setTask({...task, orarioFine: e.target.value})}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Priorità</label>
              <Select 
                value={task.priorita} 
                onValueChange={(value) => setTask({...task, priorita: value})}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Seleziona priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Bassa</SelectItem>
                  <SelectItem value="1">Media</SelectItem>
                  <SelectItem value="2">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Attività
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function TodoList() {
  const { currentSede } = useSede()
  const [dataSelezionata, setDataSelezionata] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board')
  
  // Riferimento per il calendario
  const calendarRef = useRef<HTMLDivElement>(null)
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [filtroPriorita, setFiltroPriorita] = useState<string>('tutti')

  // Funzione per caricare i task
  const caricaTasks = useCallback(async () => {
    if (!currentSede) return
    
    try {
      setIsLoading(true)
      const dataFormattata = format(dataSelezionata, 'yyyy-MM-dd')
      const response = await fetch(`/api/todolist?data=${dataFormattata}&sede=${currentSede.id}`)
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle attività')
      }
      
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore nel caricamento delle attività')
    } finally {
      setIsLoading(false)
    }
  }, [currentSede, dataSelezionata])

  // Funzione per aggiungere un task
  const aggiungiTask = async (nuovoTask: {
    titolo: string;
    descrizione: string;
    dataScadenza: string;
    orarioInizio: string;
    orarioFine: string;
    priorita: number;
    sede: string;
  }) => {
    try {
      const response = await fetch('/api/todolist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nuovoTask,
          stato: 'DA_FARE'
        }),
      })

      if (!response.ok) {
        throw new Error('Errore nella creazione dell\'attività')
      }

      await caricaTasks()
      setShowForm(false)
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore nella creazione dell\'attività')
    }
  }



  // Funzione per aggiornare lo stato di un task
  const aggiornaStatoTask = async (id: number | string, nuovoStato: StatoTask) => {
    try {
      const response = await fetch(`/api/todolist/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stato: nuovoStato
        }),
      })

      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento dell\'attività')
      }

      await caricaTasks()
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore nell\'aggiornamento dell\'attività')
    }
  }

  // Funzione per eliminare un task
  const eliminaTask = async (id: number | string) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return
    
    try {
      const response = await fetch(`/api/todolist/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione dell\'attività')
      }

      await caricaTasks()
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore nell\'eliminazione dell\'attività')
    }
  }
  // Effetto per caricare i task quando cambia la sede o la data
  useEffect(() => {
    if (currentSede) {
      caricaTasks()
    }
  }, [currentSede, caricaTasks])

  // Funzione per filtrare i task in base allo stato e alla priorità
  const tasksFiltrati = useMemo(() => {
    return tasks.filter(task => {
      const matchStato = filtroStato === 'tutti' || task.stato === filtroStato
      const matchPriorita = filtroPriorita === 'tutti' || task.priorita.toString() === filtroPriorita
      return matchStato && matchPriorita
    })
  }, [tasks, filtroStato, filtroPriorita])

  // Funzione per raggruppare i task per stato
  const tasksByStatus = useMemo(() => {
    const result = {
      DA_FARE: [] as TodoTask[],
      IN_CORSO: [] as TodoTask[],
      COMPLETATO: [] as TodoTask[],
      ANNULLATO: [] as TodoTask[]
    }
    
    tasksFiltrati.forEach(task => {
      result[task.stato].push(task)
    })
    
    return result
  }, [tasksFiltrati])
  
  // Questa variabile di stato è stata rimossa perché non più necessaria

  // Componente per visualizzare il calendario con i task
  const CalendarWithTasks = () => {
    // Raggruppa i task per data
    const tasksByDate = useMemo(() => {
      const grouped: Record<string, TodoTask[]> = {}
      
      tasks.forEach(task => {
        if (task.dataScadenza) {
          const date = task.dataScadenza.split('T')[0]
          if (!grouped[date]) {
            grouped[date] = []
          }
          grouped[date].push(task)
        }
      })
      
      return grouped
    }, [tasks])
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sezione Calendario */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Calendario Attività</h2>
            <p className="text-sm text-gray-600">Seleziona una data per visualizzare le attività</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <CalendarComponent
              mode="single"
              selected={dataSelezionata}
              onSelect={(date) => date && setDataSelezionata(date)}
              className="mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-3"
              modifiers={{
                booked: (date) => {
                  const dateString = format(date, 'yyyy-MM-dd')
                  return Boolean(tasksByDate[dateString]?.length)
                },
                hasHighPriority: (date) => {
                  const dateString = format(date, 'yyyy-MM-dd')
                  return Boolean(tasksByDate[dateString]?.some(task => task.priorita === 2))
                },
                hasMediumPriority: (date) => {
                  const dateString = format(date, 'yyyy-MM-dd')
                  return Boolean(tasksByDate[dateString]?.some(task => task.priorita === 1) && !tasksByDate[dateString]?.some(task => task.priorita === 2))
                }
              }}
              modifiersClassNames={{
                booked: 'bg-blue-100 text-blue-900 font-semibold border border-blue-200',
                hasHighPriority: 'bg-red-100 text-red-900 font-bold border border-red-300',
                hasMediumPriority: 'bg-yellow-100 text-yellow-900 font-semibold border border-yellow-300'
              }}
            />
          </div>
          
          {/* Legenda */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda:</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-gray-600">Alta priorità</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-gray-600">Media priorità</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-gray-600">Con attività</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sezione Attività del Giorno */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Attività per {format(dataSelezionata, 'dd MMMM yyyy', { locale: it })}
            </h3>
            <p className="text-sm text-gray-600">Gestisci le attività del giorno selezionato</p>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tasksByDate[format(dataSelezionata, 'yyyy-MM-dd')]?.length ? (
              tasksByDate[format(dataSelezionata, 'yyyy-MM-dd')].map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={aggiornaStatoTask} 
                  onDelete={eliminaTask} 
                />
              ))
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Nessuna attività per questa data</h3>
                <p className="text-gray-500 mb-6">Non ci sono attività programmate per il giorno selezionato</p>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Attività
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Effetto per caricare i task all'avvio e quando cambia la data
  useEffect(() => {
    if (currentSede) {
      caricaTasks()
    }
  }, [currentSede, dataSelezionata])

  // Questa funzione è stata rimossa perché duplicata

  // Questa funzione è stata rimossa perché duplicata

  // Questa funzione è stata rimossa perché duplicata

  // Questa funzione è stata rimossa perché duplicata

  // Funzione per ottenere il colore in base alla priorità
  const getColorePriorita = (priorita: number) => {
    switch (priorita) {
      case 0: return 'bg-gray-100 text-gray-700'
      case 1: return 'bg-yellow-100 text-yellow-700'
      case 2: return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Funzione per ottenere l'icona in base allo stato
  const getIconaStato = (stato: StatoTask) => {
    switch (stato) {
      case 'DA_FARE': return <AlertCircle className="w-5 h-5 text-gray-500" />
      case 'IN_CORSO': return <Clock className="w-5 h-5 text-blue-500" />
      case 'COMPLETATO': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'ANNULLATO': return <Trash2 className="w-5 h-5 text-red-500" />
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  // Funzione per formattare la data
  const formattaData = (dataString?: string) => {
    if (!dataString) return ''
    const data = new Date(dataString)
    return data.toLocaleDateString('it-IT')
  }

  // Funzione per formattare l'orario
  const formattaOrario = (orarioString?: string) => {
    if (!orarioString) return ''
    const orario = new Date(orarioString)
    return orario.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Rendering del componente principale
  if (!currentSede) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Seleziona una sede</h2>
          <p className="text-gray-600">Per visualizzare le attività, seleziona prima una sede</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-2 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Attività di {currentSede.nome}</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestisci le attività della sede</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Tabs defaultValue="board" onValueChange={(value) => setViewMode(value as 'board' | 'calendar')} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-none sm:flex">
                <TabsTrigger value="board" className="text-xs sm:text-sm">
                  <ListTodo className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Board</span>
                  <span className="sm:hidden">Lista</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Calendario</span>
                  <span className="sm:hidden">Cal</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto text-sm">
              {showForm ? (
                <>
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Chiudi</span>
                  <span className="sm:hidden">✕</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Nuova Attività</span>
                  <span className="sm:hidden">Aggiungi</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Form per aggiungere un nuovo task */}
        {showForm && (
          <TaskForm 
            onSubmit={aggiungiTask} 
            onCancel={() => setShowForm(false)} 
          />
        )}
        
        {/* Filtri */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">Data:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal w-full sm:w-auto text-xs sm:text-sm">
                  <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{format(dataSelezionata, 'dd MMMM yyyy', { locale: it })}</span>
                  <span className="sm:hidden">{format(dataSelezionata, 'dd/MM', { locale: it })}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="bg-white p-3 rounded-lg shadow-lg">
                  <CalendarComponent
                    mode="single"
                    selected={dataSelezionata}
                    onSelect={(date) => date && setDataSelezionata(date)}
                    className="bg-white border-0"
                    initialFocus
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">Stato:</label>
            <Select value={filtroStato} onValueChange={setFiltroStato}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti</SelectItem>
                <SelectItem value="DA_FARE">Da fare</SelectItem>
                <SelectItem value="IN_CORSO">In corso</SelectItem>
                <SelectItem value="COMPLETATO">Completato</SelectItem>
                <SelectItem value="ANNULLATO">Annullato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">Priorità:</label>
            <Select value={filtroPriorita} onValueChange={setFiltroPriorita}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutte</SelectItem>
                <SelectItem value="0">Bassa</SelectItem>
                <SelectItem value="1">Media</SelectItem>
                <SelectItem value="2">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        viewMode === 'board' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-gray-50 rounded-lg p-2 sm:p-4 h-[calc(100vh-350px)] sm:h-[calc(100vh-300px)] flex flex-col">
              <TaskColumn 
                title="Da fare" 
                icon={<AlertCircle className="w-5 h-5 text-gray-600" />}
                tasks={tasksByStatus.DA_FARE} 
                onUpdateStatus={aggiornaStatoTask} 
                onDelete={eliminaTask} 
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 h-[calc(100vh-300px)] flex flex-col">
              <TaskColumn 
                title="In corso" 
                icon={<Clock className="w-5 h-5 text-blue-600" />}
                tasks={tasksByStatus.IN_CORSO} 
                onUpdateStatus={aggiornaStatoTask} 
                onDelete={eliminaTask} 
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 h-[calc(100vh-300px)] flex flex-col">
              <TaskColumn 
                title="Completato" 
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                tasks={tasksByStatus.COMPLETATO} 
                onUpdateStatus={aggiornaStatoTask} 
                onDelete={eliminaTask} 
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 h-[calc(100vh-300px)] flex flex-col">
              <TaskColumn 
                title="Annullato" 
                icon={<Trash2 className="w-5 h-5 text-red-600" />}
                tasks={tasksByStatus.ANNULLATO} 
                onUpdateStatus={aggiornaStatoTask} 
                onDelete={eliminaTask} 
              />
            </div>
          </div>
        ) : (
          <CalendarWithTasks />
        )
      )}
    </div>
  )
}