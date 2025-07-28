'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Settings, Save, RotateCcw, Euro, Calculator, TrendingUp, ArrowLeft, Plus, Trash2, Edit } from 'lucide-react'
import { useSede } from '@/hooks/useSede'

interface Servizio {
  id: number
  nome: string
  prezzoCliente: number
  costoNetto: number
  ivaPercent: number
}

interface NuovoServizio {
  nome: string
  prezzoCliente: string
  costoNetto: string
  ivaPercent: string
}

export default function ImpostazioniPage() {
  const { currentSede } = useSede()
  const [servizi, setServizi] = useState<Servizio[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nuovoServizio, setNuovoServizio] = useState<NuovoServizio>({
    nome: '',
    prezzoCliente: '',
    costoNetto: '',
    ivaPercent: '22'
  })

  useEffect(() => {
    fetchServizi()
  }, [])

  const fetchServizi = async () => {
    try {
      const response = await fetch('/api/servizi')
      if (response.ok) {
        const data = await response.json()
        setServizi(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error)
    }
  }

  const handleAddServizio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuovoServizio.nome || !nuovoServizio.prezzoCliente || nuovoServizio.costoNetto === '') return

    setLoading(true)
    try {
      const response = await fetch('/api/servizi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nuovoServizio.nome,
          prezzoCliente: parseFloat(nuovoServizio.prezzoCliente),
          costoNetto: parseFloat(nuovoServizio.costoNetto),
          ivaPercent: parseFloat(nuovoServizio.ivaPercent)
        })
      })

      if (response.ok) {
        const servizioCreato = await response.json()
        setServizi([...servizi, servizioCreato])
        setNuovoServizio({ nome: '', prezzoCliente: '', costoNetto: '', ivaPercent: '22' })
        setShowAddForm(false)
        alert('Servizio aggiunto con successo!')
      } else {
        throw new Error('Errore nella creazione del servizio')
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del servizio:', error)
      alert('Errore durante l\'aggiunta del servizio')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateServizio = async (servizio: Servizio) => {
    setLoading(true)
    try {
      const response = await fetch('/api/servizi', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servizio)
      })

      if (response.ok) {
        const servizioAggiornato = await response.json()
        setServizi(servizi.map(s => s.id === servizio.id ? servizioAggiornato : s))
        setEditingId(null)
        alert('Servizio aggiornato con successo!')
      } else {
        throw new Error('Errore nell\'aggiornamento del servizio')
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del servizio:', error)
      alert('Errore durante l\'aggiornamento del servizio')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteServizio = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/servizi?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setServizi(servizi.filter(s => s.id !== id))
        alert('Servizio eliminato con successo!')
      } else {
        throw new Error('Errore nell\'eliminazione del servizio')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del servizio:', error)
      alert('Errore durante l\'eliminazione del servizio')
    } finally {
      setLoading(false)
    }
  }

  const calcolaGuadagno = (servizio: Servizio) => {
    return servizio.prezzoCliente - servizio.costoNetto
  }

  const calcolaMargine = (servizio: Servizio) => {
    return servizio.prezzoCliente > 0 ? ((calcolaGuadagno(servizio) / servizio.prezzoCliente) * 100) : 0
  }

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-blue-900">
              <Settings className="h-8 w-8 text-blue-600" />
              Gestione Servizi
            </h1>
            <p className="text-gray-600">
              Configura i prezzi dei servizi e aggiungi nuovi servizi
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Servizio
        </Button>
      </div>

      {/* Form Aggiungi Servizio */}
      {showAddForm && (
        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-yellow-400">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              Aggiungi Nuovo Servizio
            </CardTitle>
            <CardDescription className="text-gray-700">
              Inserisci i dettagli del nuovo servizio da aggiungere al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddServizio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Nome Servizio</label>
                  <Input
                    value={nuovoServizio.nome}
                    onChange={(e) => setNuovoServizio({...nuovoServizio, nome: e.target.value})}
                    placeholder="Es. Certificato di Nascita"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Prezzo Cliente (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuovoServizio.prezzoCliente}
                    onChange={(e) => setNuovoServizio({...nuovoServizio, prezzoCliente: e.target.value})}
                    placeholder="15.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Costo Netto (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuovoServizio.costoNetto}
                    onChange={(e) => setNuovoServizio({...nuovoServizio, costoNetto: e.target.value})}
                    placeholder="3.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">IVA (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={nuovoServizio.ivaPercent}
                    onChange={(e) => setNuovoServizio({...nuovoServizio, ivaPercent: e.target.value})}
                    placeholder="22"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? 'Aggiungendo...' : 'Aggiungi Servizio'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-gray-300 hover:bg-gray-50">
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista Servizi */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="bg-blue-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Euro className="h-5 w-5 text-blue-600" />
            Servizi Configurati ({servizi.length})
          </CardTitle>
          <CardDescription className="text-gray-600">
            Gestisci i prezzi e le informazioni dei servizi esistenti
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {servizi.map((servizio) => {
              const guadagno = calcolaGuadagno(servizio)
              const margine = calcolaMargine(servizio)
              const isEditing = editingId === servizio.id
              
              return (
                <div key={servizio.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                  {isEditing ? (
                    <EditServizioForm 
                      servizio={servizio}
                      onSave={handleUpdateServizio}
                      onCancel={() => setEditingId(null)}
                      loading={loading}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">{servizio.nome}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Prezzo: {formatCurrency(servizio.prezzoCliente)}</span>
                              <span>Costo: {formatCurrency(servizio.costoNetto)}</span>
                              <span>IVA: {servizio.ivaPercent}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              guadagno > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              Guadagno: {formatCurrency(guadagno)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              margine > 20 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              Margine: {margine.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(servizio.id)}
                          className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteServizio(servizio.id)}
                          className="gap-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            
            {servizi.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Euro className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                <p className="text-blue-900">Nessun servizio configurato</p>
                <p className="text-sm text-gray-600">Aggiungi il primo servizio per iniziare</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente per modificare un servizio
interface EditServizioFormProps {
  servizio: Servizio
  onSave: (servizio: Servizio) => void
  onCancel: () => void
  loading: boolean
}

function EditServizioForm({ servizio, onSave, onCancel, loading }: EditServizioFormProps) {
  const [editedServizio, setEditedServizio] = useState<Servizio>(servizio)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(editedServizio)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium block mb-2">Nome Servizio</label>
          <Input
            value={editedServizio.nome}
            onChange={(e) => setEditedServizio({...editedServizio, nome: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Prezzo Cliente (€)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editedServizio.prezzoCliente}
            onChange={(e) => setEditedServizio({...editedServizio, prezzoCliente: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Costo Netto (€)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editedServizio.costoNetto}
            onChange={(e) => setEditedServizio({...editedServizio, costoNetto: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">IVA (%)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={editedServizio.ivaPercent}
            onChange={(e) => setEditedServizio({...editedServizio, ivaPercent: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? 'Salvando...' : 'Salva'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="border-gray-300 hover:bg-gray-50">
          Annulla
        </Button>
      </div>
    </form>
  )
}