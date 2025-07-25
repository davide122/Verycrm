'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Settings, Clock, TrendingUp, Star, Activity, Zap, Package, CheckCircle, AlertCircle, Award } from 'lucide-react'
import { useSede } from '@/hooks/useSede'
import { formatCurrency, formatDate, getOpzioniServizi, calcolaPrezzoServizio, SERVIZI_DISPONIBILI } from '@/lib/utils'

interface Servizio {
  value: string
  label: string
  descrizione: string
  prezzoCliente: number
  costoNetto: number
  ivaPercent: number
}

interface ServizioEffettuato {
  id: number
  servizioId: number
  quantita: number
  prezzoCliente: number
  costoTotale: number
  guadagno: number
  turno: string
  createdAt: string
  servizio: Servizio
}

interface ServizioDatabase {
  id: number
  nome: string
  prezzoCliente: number
  costoNetto: number
  ivaPercent: number
}

export default function ServiziPage() {
  const { currentSede } = useSede()
  const [serviziEffettuati, setServiziEffettuati] = useState<ServizioEffettuato[]>([])
  const [servizi, setServizi] = useState<Servizio[]>([])
  const [selectedServizio, setSelectedServizio] = useState('')
  const [quantita, setQuantita] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetchServizi()
    fetchServiziEffettuati()
  }, [currentSede])

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      setCurrentTime(new Date())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchServizi = async () => {
    try {
      const response = await fetch('/api/servizi')
      if (response.ok) {
        const data = await response.json()
        // Trasforma i dati del database nel formato atteso dal componente
        const serviziFormattati = data.map((servizio: ServizioDatabase) => ({
          value: servizio.id.toString(),
          label: servizio.nome,
          descrizione: servizio.nome,
          prezzoCliente: servizio.prezzoCliente,
          costoNetto: servizio.costoNetto,
          ivaPercent: servizio.ivaPercent
        }))
        setServizi(serviziFormattati)
      }
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error)
    }
  }

  const fetchServiziEffettuati = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const sedeParam = currentSede?.id ? `&sede=${currentSede.id}` : ''
      const response = await fetch(`/api/servizi-effettuati?data=${today}${sedeParam}`)
      if (response.ok) {
        const data = await response.json()
        setServiziEffettuati(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento dei servizi effettuati:', error)
      setServiziEffettuati([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServizio || !quantita) return

    setLoading(true)
    try {
      const response = await fetch('/api/servizi-effettuati', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servizioId: selectedServizio,
          quantita: parseInt(quantita),
          turno: currentTime && currentTime.getHours() < 14 ? 'mattina' : 'pomeriggio',
          sede: currentSede?.id
        })
      })

      if (response.ok) {
        const nuovoServizio = await response.json()
        setServiziEffettuati([nuovoServizio, ...serviziEffettuati])
        setSelectedServizio('')
        setQuantita('')
        alert(`Servizio registrato con successo!`)
      } else {
        throw new Error('Errore nella registrazione del servizio')
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del servizio:', error)
      alert('Errore durante la registrazione del servizio')
    } finally {
      setLoading(false)
    }
  }



  const totaleGiornata = serviziEffettuati.reduce((acc, servizio) => {
    acc.entrate += servizio.prezzoCliente
    acc.costi += servizio.costoTotale
    acc.guadagni += servizio.guadagno
    return acc
  }, { entrate: 0, costi: 0, guadagni: 0 })

  const currentShift = mounted && currentTime ? (currentTime.getHours() < 14 ? 'Mattina' : 'Pomeriggio') : 'Mattina'
  const shiftTime = mounted && currentTime ? (currentTime.getHours() < 14 ? '8:30-13:00' : '16:00-19:00') : '8:30-13:00'
  const greeting = mounted && currentTime ? 
    (currentTime.getHours() < 12 ? 'Buongiorno' : currentTime.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera') : 
    'Buongiorno'

  const selectedServizioData = servizi.find(s => s.value === selectedServizio)
  const previewCalcolo = selectedServizioData && quantita ? {
    prezzoCliente: selectedServizioData.prezzoCliente * parseInt(quantita),
    costoConIva: selectedServizioData.costoNetto * (1 + selectedServizioData.ivaPercent / 100) * parseInt(quantita),
    guadagno: (selectedServizioData.prezzoCliente - selectedServizioData.costoNetto * (1 + selectedServizioData.ivaPercent / 100)) * parseInt(quantita),
    quantita: parseInt(quantita)
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/impostazioni">
              <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-blue-900">
                Servizi Postali
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">Gestione avanzata servizi postali</p>
                {currentSede && (
                  <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>📍 {currentSede.nome}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-white rounded-lg px-6 py-3 border border-gray-200">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-800">{currentShift}</span>
            <span className="text-gray-500 text-sm">({shiftTime})</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Entrate Oggi</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totaleGiornata.entrate)}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Guadagno</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totaleGiornata.guadagni)}</p>
                </div>
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Servizi</p>
                  <p className="text-2xl font-bold text-blue-900">{serviziEffettuati.length}</p>
                </div>
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Margine</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totaleGiornata.entrate > 0 ? 
                       `${((totaleGiornata.guadagni / totaleGiornata.entrate) * 100).toFixed(1)}%` : 
                       "0%"
                     }
                  </p>
                </div>
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form per aggiungere servizio - Migliorato */}
          <Card className="lg:col-span-2 bg-white border border-gray-200">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                Aggiungi Nuovo Servizio
              </CardTitle>
              <CardDescription className="text-blue-100">
                Seleziona un servizio e specifica la quantità per registrare l&apos;operazione
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-gray-700">
                      Tipo di Servizio
                    </label>
                    <Select value={selectedServizio} onValueChange={setSelectedServizio}>
                      <SelectTrigger className="h-12 border border-gray-300 hover:border-blue-600 focus:border-blue-600 bg-white">
                        <SelectValue placeholder="Seleziona un servizio" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {servizi.map((servizio) => (
                          <SelectItem key={servizio.value} value={servizio.value} className="py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-medium">{servizio.label}</span>
                              </div>
                              <span className="text-xs text-gray-500">{formatCurrency(servizio.prezzoCliente)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-3 block text-gray-700">
                      Quantità
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantita}
                      onChange={(e) => setQuantita(e.target.value)}
                      placeholder="Inserisci quantità"
                      className="h-12 border border-gray-300 hover:border-blue-600 focus:border-blue-600 text-lg"
                    />
                  </div>
                </div>



                {/* Preview */}
                {previewCalcolo && (
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Anteprima Operazione
                    </h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-gray-600 text-sm">Prezzo Cliente</p>
                        <p className="text-xl font-bold text-blue-900">{formatCurrency(previewCalcolo.prezzoCliente)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Costo Azienda</p>
                        <p className="text-xl font-bold text-gray-700">{formatCurrency(previewCalcolo.costoConIva)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Guadagno</p>
                        <p className="text-xl font-bold text-yellow-600">{formatCurrency(previewCalcolo.guadagno)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Quantità</p>
                        <p className="text-xl font-bold text-blue-900">{previewCalcolo.quantita}x</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading || !selectedServizio || !quantita} 
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Registra Servizio
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Riepilogo giornata - Migliorato */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="bg-yellow-400 text-gray-900">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                Riepilogo Giornata
              </CardTitle>
              <CardDescription className="text-gray-700">
                {formatDate(new Date())} • {greeting}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Entrate Totali</span>
                    <span className="text-xl font-bold text-blue-900">
                      {formatCurrency(totaleGiornata.entrate)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Costi Totali</span>
                    <span className="text-xl font-bold text-gray-700">
                      {formatCurrency(totaleGiornata.costi)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Guadagno Netto</span>
                    <span className="text-xl font-bold text-yellow-600">
                      {formatCurrency(totaleGiornata.guadagni)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Margine</span>
                    <span className="text-xl font-bold text-blue-900">
                      {totaleGiornata.entrate > 0 ? 
                         `${((totaleGiornata.guadagni / totaleGiornata.entrate) * 100).toFixed(1)}%` : 
                         "0%"
                       }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista servizi effettuati */}
        <Card className="mt-8 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Servizi Effettuati Oggi</CardTitle>
          </CardHeader>
          <CardContent>
            {serviziEffettuati.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nessun servizio registrato oggi
              </p>
            ) : (
              <div className="space-y-4">
                {serviziEffettuati.map((servizio) => (
                  <div key={servizio.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{servizio.servizio.label}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          Quantità: {servizio.quantita} | Turno: {servizio.turno}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(servizio.createdAt).toLocaleTimeString('it-IT')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(servizio.prezzoCliente)}</p>
                        <p className="text-sm text-yellow-600 font-medium">
                          Guadagno: {formatCurrency(servizio.guadagno)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Costo: {formatCurrency(servizio.costoTotale)}
                        </p>


                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}