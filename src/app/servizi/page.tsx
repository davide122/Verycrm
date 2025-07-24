'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, TrendingUp, Clock, Star, Zap, Target, Award, Activity, CheckCircle, Settings } from 'lucide-react'
import { formatCurrency, formatDate, getOpzioniServizi, calcolaPrezzoServizio, SERVIZI_DISPONIBILI, PREZZI_SERVIZI } from '@/lib/utils'
import { useSede } from '@/hooks/useSede'

interface ServizioEffettuato {
  id: number
  tipoServizio: string
  quantita: number
  prezzoCliente: number
  costoTotale: number
  guadagno: number
  turno: string
  createdAt: string
  nome: string
}

export default function ServiziPage() {
  const { saveData, loadData } = useSede()
  const [serviziEffettuati, setServiziEffettuati] = useState<ServizioEffettuato[]>([])
  const [selectedServizio, setSelectedServizio] = useState('')
  const [quantita, setQuantita] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const opzioniServizi = getOpzioniServizi()

  useEffect(() => {
    fetchServiziEffettuati()
  }, [])

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      setCurrentTime(new Date())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchServiziEffettuati = async () => {
    try {
      // Carica da localStorage usando il hook useSede
      const servizi = loadData('servizi')
      setServiziEffettuati(servizi)
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
      const calcoloPrezzi = calcolaPrezzoServizio(selectedServizio as keyof typeof PREZZI_SERVIZI, parseInt(quantita))
      const turnoCorrente = currentTime && currentTime.getHours() < 14 ? 'mattina' : 'pomeriggio'
      const servizioInfo = SERVIZI_DISPONIBILI.find(s => s.id === selectedServizio)
      
      const nuovoServizio: ServizioEffettuato = {
        id: Date.now(),
        tipoServizio: selectedServizio,
        quantita: parseInt(quantita),
        prezzoCliente: calcoloPrezzi.prezzoCliente,
        costoTotale: calcoloPrezzi.costoConIva,
        guadagno: calcoloPrezzi.guadagno,
        turno: turnoCorrente,
        createdAt: new Date().toISOString(),
        nome: servizioInfo?.nome || selectedServizio
      }
      
      const nuoviServizi = [nuovoServizio, ...serviziEffettuati]
      setServiziEffettuati(nuoviServizi)
      
      // Salva usando il hook useSede
      saveData('servizi', nuoviServizi)
      
      setSelectedServizio('')
      setQuantita('')
      
      // Simula salvataggio
      setTimeout(() => {
        alert(`Servizio ${servizioInfo?.nome} registrato con successo!`)
      }, 500)
    } catch (error) {
      console.error('Errore nell&apos;aggiunta del servizio:', error)
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

  const previewCalcolo = selectedServizio && quantita ? 
    calcolaPrezzoServizio(selectedServizio as keyof typeof PREZZI_SERVIZI, parseInt(quantita)) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Servizi Pro
              </h1>
              <p className="text-gray-600 mt-1">Gestione avanzata servizi postali</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-800">{currentShift}</span>
            <span className="text-gray-500 text-sm">({shiftTime})</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Entrate Oggi</p>
                  <p className="text-3xl font-bold">{formatCurrency(totaleGiornata.entrate)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Guadagno</p>
                  <p className="text-3xl font-bold">{formatCurrency(totaleGiornata.guadagni)}</p>
                </div>
                <Star className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Servizi</p>
                  <p className="text-3xl font-bold">{serviziEffettuati.length}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Efficienza</p>
                  <p className="text-3xl font-bold">98%</p>
                </div>
                <Target className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form per aggiungere servizio - Migliorato */}
          <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
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
                      <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-400 transition-colors">
                        <SelectValue placeholder="Seleziona un servizio" />
                      </SelectTrigger>
                      <SelectContent>
                        {opzioniServizi.map((servizio) => (
                          <SelectItem key={servizio.value} value={servizio.value} className="py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-medium">{servizio.label}</span>
                              </div>
                              <span className="text-xs text-gray-500">{servizio.descrizione}</span>
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
                      className="h-12 border-2 border-gray-200 hover:border-blue-400 transition-colors text-lg"
                    />
                  </div>
                </div>

                {/* Preview */}
                {previewCalcolo && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      Anteprima Operazione
                    </h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-gray-600 text-sm">Prezzo Cliente</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(previewCalcolo.prezzoCliente)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Costo Azienda</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(previewCalcolo.costoConIva)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Guadagno</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(previewCalcolo.guadagno)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Quantità</p>
                        <p className="text-xl font-bold text-purple-600">{previewCalcolo.quantita}x</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading || !selectedServizio || !quantita} 
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                Riepilogo Live
              </CardTitle>
              <CardDescription className="text-green-100">
                {formatDate(new Date())} • {greeting}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">💰 Entrate Totali</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(totaleGiornata.entrate)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">💸 Costi Totali</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatCurrency(totaleGiornata.costi)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">🎯 Guadagno Netto</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totaleGiornata.guadagni)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">📊 Margine</span>
                    <span className="text-2xl font-bold text-purple-600">
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Servizi Effettuati Oggi</CardTitle>
          </CardHeader>
          <CardContent>
            {serviziEffettuati.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nessun servizio registrato oggi
              </p>
            ) : (
              <div className="space-y-4">
                {serviziEffettuati.map((servizio) => (
                  <div key={servizio.id} className="border rounded-lg p-4 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{servizio.nome}</h3>
                        <p className="text-sm text-gray-600">
                          Quantità: {servizio.quantita} | Turno: {servizio.turno}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(servizio.createdAt).toLocaleTimeString('it-IT')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(servizio.prezzoCliente)}</p>
                        <p className="text-sm text-green-600 font-medium">
                          Guadagno: {formatCurrency(servizio.guadagno)}
                        </p>
                        <p className="text-xs text-red-500">
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