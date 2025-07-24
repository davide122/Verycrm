'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Plus, Package, Truck, Scale, Shield, Zap, TrendingUp, Clock, Star, Target, Award, Activity, CheckCircle, Calculator, Layers, Box, Settings } from 'lucide-react'
import { formatCurrency, formatDate, calcolaPrezzo } from '@/lib/utils'
import { useSede } from '@/hooks/useSede'

interface Spedizione {
  id: number
  peso: number
  pellicola: boolean
  imballaggio: boolean
  prezzoPoste: number
  iva: number
  rimborsoSpese: number
  prezzoCliente: number
  guadagno: number
  turno: string
  createdAt: string
}

export default function SpedizioniPage() {
  const { currentSede, saveData, loadData } = useSede()
  const [spedizioni, setSpedizioni] = useState<Spedizione[]>([])
  const [peso, setPeso] = useState('')
  const [pellicola, setPellicola] = useState(false)
  const [imballaggio, setImballaggio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prezzoCalcolato, setPrezzoCalcolato] = useState<{
    poste: number;
    iva: number;
    rimborso: number;
    cliente: number;
    guadagno: number;
    varie: number;
  } | null>(null)

  useEffect(() => {
    fetchSpedizioni()
  }, [])

  useEffect(() => {
    if (peso) {
      const pesoNum = parseFloat(peso)
      if (pesoNum > 0) {
        const calcolo = calcolaPrezzo(pesoNum, pellicola, imballaggio)
        setPrezzoCalcolato(calcolo)
      } else {
        setPrezzoCalcolato(null)
      }
    } else {
      setPrezzoCalcolato(null)
    }
  }, [peso, pellicola, imballaggio])

  const fetchSpedizioni = async () => {
    try {
      // Carica da localStorage usando il hook useSede
      const spedizioniData = loadData('spedizioni')
      setSpedizioni(spedizioniData)
    } catch (error) {
      console.error('Errore nel caricamento delle spedizioni:', error)
      setSpedizioni([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!peso || !prezzoCalcolato) return

    setLoading(true)
    try {
      const turnoCorrente = currentTime && currentTime.getHours() < 14 ? 'mattina' : 'pomeriggio'
      
      const nuovaSpedizione: Spedizione = {
        id: Date.now(),
        peso: parseFloat(peso),
        pellicola,
        imballaggio,
        prezzoPoste: prezzoCalcolato.poste,
        iva: prezzoCalcolato.iva,
        rimborsoSpese: prezzoCalcolato.rimborso,
        prezzoCliente: prezzoCalcolato.cliente,
        guadagno: prezzoCalcolato.guadagno,
        turno: turnoCorrente,
        createdAt: new Date().toISOString()
      }
      
      const nuoveSpedizioni = [nuovaSpedizione, ...spedizioni]
      setSpedizioni(nuoveSpedizioni)
      
      // Salva usando il hook useSede
      saveData('spedizioni', nuoveSpedizioni)
      
      setPeso('')
      setPellicola(false)
      setImballaggio(false)
      setPrezzoCalcolato(null)
      
      // Simula salvataggio
      setTimeout(() => {
        alert(`Spedizione di ${parseFloat(peso)}kg registrata con successo!`)
      }, 500)
    } catch (error) {
      console.error('Errore nell&apos;aggiunta della spedizione:', error)
      alert('Errore durante la registrazione della spedizione')
    } finally {
      setLoading(false)
    }
  }

  const totaleGiornata = spedizioni.reduce((acc, spedizione) => {
    acc.entrate += spedizione.prezzoCliente
    acc.costi += spedizione.rimborsoSpese
    acc.guadagni += spedizione.guadagno
    return acc
  }, { entrate: 0, costi: 0, guadagni: 0 })

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      setCurrentTime(new Date())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const currentShift = mounted && currentTime ? (currentTime.getHours() < 14 ? 'Mattina' : 'Pomeriggio') : 'Caricamento...'
  const shiftTime = mounted && currentTime ? (currentTime.getHours() < 14 ? '8:30-13:00' : '16:00-19:00') : '--:--'
  const greeting = mounted && currentTime ? (currentTime.getHours() < 12 ? 'Buongiorno' : currentTime.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera') : 'Ciao'

  const pesoMedio = spedizioni.length > 0 ? 
    (spedizioni.reduce((acc, s) => acc + s.peso, 0) / spedizioni.length).toFixed(1) : '0'
  const marginePercentuale = totaleGiornata.entrate > 0 ? 
    ((totaleGiornata.guadagni / totaleGiornata.entrate) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
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
              <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Spedizioni Express
              </h1>
              <p className="text-gray-600 mt-1">Sistema avanzato gestione spedizioni</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
            <Truck className="w-5 h-5 text-orange-500" />
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
                  <p className="text-purple-100 text-sm font-medium">Spedizioni</p>
                  <p className="text-3xl font-bold">{spedizioni.length}</p>
                </div>
                <Package className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Peso Medio</p>
                  <p className="text-3xl font-bold">{pesoMedio}kg</p>
                </div>
                <Scale className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form per aggiungere spedizione - Migliorato */}
          <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                Nuova Spedizione
              </CardTitle>
              <CardDescription className="text-orange-100">
                Inserisci peso e seleziona servizi aggiuntivi per calcolare automaticamente il prezzo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Peso del Pacco (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Es. 2.5"
                    className="h-12 border-2 border-gray-200 hover:border-orange-400 transition-colors text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Servizi Aggiuntivi
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 transition-colors">
                      <Checkbox
                        id="pellicola"
                        checked={pellicola}
                        onCheckedChange={(checked) => setPellicola(checked as boolean)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <label htmlFor="pellicola" className="font-medium text-gray-800 cursor-pointer flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500" />
                          Pellicola Protettiva
                        </label>
                        <p className="text-sm text-gray-600">+3€ • Protezione extra</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 transition-colors">
                      <Checkbox
                        id="imballaggio"
                        checked={imballaggio}
                        onCheckedChange={(checked) => setImballaggio(checked as boolean)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <label htmlFor="imballaggio" className="font-medium text-gray-800 cursor-pointer flex items-center gap-2">
                          <Box className="w-4 h-4 text-green-500" />
                          Imballaggio Rinforzato
                        </label>
                        <p className="text-sm text-gray-600">+5€ • Sicurezza massima</p>
                      </div>
                    </div>
                  </div>
                </div>

                {prezzoCalcolato && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-orange-500" />
                      Calcolo Automatico Prezzi
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-600 text-sm">Prezzo Poste</p>
                        <p className="text-xl font-bold text-gray-800">{formatCurrency(prezzoCalcolato.poste)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-600 text-sm">IVA (22%)</p>
                        <p className="text-xl font-bold text-yellow-600">{formatCurrency(prezzoCalcolato.iva)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-600 text-sm">Rimborso Spese</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(prezzoCalcolato.rimborso)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-600 text-sm">Varie</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(prezzoCalcolato.varie || 0)}</p>
                      </div>
                      <div className="bg-green-100 rounded-lg p-3 text-center border border-green-300">
                        <p className="text-green-700 text-sm font-medium">Prezzo Cliente</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(prezzoCalcolato.cliente)}</p>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-300">
                        <p className="text-blue-700 text-sm font-medium">Guadagno Netto</p>
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(prezzoCalcolato.guadagno)}</p>
                      </div>
                      <div className="bg-purple-100 rounded-lg p-3 text-center border border-purple-300">
                        <p className="text-purple-700 text-sm font-medium">Margine</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {((prezzoCalcolato.guadagno / prezzoCalcolato.cliente) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading || !peso} 
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Registra Spedizione
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Riepilogo giornata - Migliorato */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                Dashboard Live
              </CardTitle>
              <CardDescription className="text-blue-100">
                {mounted && currentTime ? formatDate(currentTime) : 'Caricamento...'} • {greeting}
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
                      {marginePercentuale}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">📦 Spedizioni</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {spedizioni.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista spedizioni - Migliorata */}
        <Card className="mt-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              Registro Spedizioni Live
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Monitoraggio in tempo reale delle spedizioni giornaliere
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {spedizioni.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nessuna spedizione oggi</h3>
                <p className="text-gray-500">Inizia registrando la tua prima spedizione del turno</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Spedizioni Registrate ({spedizioni.length})</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Activity className="w-4 h-4" />
                    <span>Aggiornamento automatico</span>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {spedizioni.map((spedizione, index) => (
                    <div key={spedizione.id} className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="ml-12">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Scale className="w-5 h-5 text-orange-500" />
                              <span className="text-2xl font-bold text-gray-800">{spedizione.peso}kg</span>
                            </div>
                            
                            <div className="flex gap-2">
                              {spedizione.pellicola && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  <Layers className="w-3 h-3" />
                                  Pellicola
                                </span>
                              )}
                              {spedizione.imballaggio && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                  <Box className="w-3 h-3" />
                                  Imballaggio
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500">Turno:</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                                {spedizione.turno}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(spedizione.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700">Prezzo Cliente</span>
                            </div>
                            <p className="text-xl font-bold text-green-700">{formatCurrency(spedizione.prezzoCliente)}</p>
                          </div>
                          
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-700">Guadagno</span>
                            </div>
                            <p className="text-xl font-bold text-blue-700">{formatCurrency(spedizione.guadagno)}</p>
                          </div>
                          
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium text-red-700">Rimborso</span>
                            </div>
                            <p className="text-xl font-bold text-red-700">{formatCurrency(spedizione.rimborsoSpese)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">IVA: {formatCurrency(spedizione.iva)}</span>
                              <span className="text-gray-600">Poste: {formatCurrency(spedizione.prezzoPoste)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Margine:</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold">
                                {((spedizione.guadagno / spedizione.prezzoCliente) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}