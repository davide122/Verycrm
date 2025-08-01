'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, DollarSign, Clock, MapPin, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSede } from '@/hooks/useSede'

interface Ricarica {
  id: number
  importo: number
  descrizione?: string
  turno: string
  sede: string
  createdAt: string
}

interface SaldoData {
  id: number
  data: string
  saldoIniziale: number
  saldoFinale?: number
  saldoTotale: number
  totaleRicariche: number
  ricariche: Ricarica[]
}

export default function SaldoDroppointPage() {
  const { currentSede } = useSede()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [saldoData, setSaldoData] = useState<SaldoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [saldoIniziale, setSaldoIniziale] = useState('')
  const [saldoFinale, setSaldoFinale] = useState('')
  const [nuovaRicarica, setNuovaRicarica] = useState({
    importo: '',
    descrizione: '',
    turno: 'Mattina'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const fetchSaldoData = async () => {
    if (!selectedDate) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/saldo-droppoint?data=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setSaldoData(data)
        setSaldoIniziale(data.saldoIniziale.toString())
        setSaldoFinale(data.saldoFinale?.toString() || '')
      }
    } catch (error) {
      console.error('Errore nel caricamento saldo:', error)
    } finally {
      setLoading(false)
    }
  }

  const salvaSaldo = async () => {
    if (!selectedDate) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/saldo-droppoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: selectedDate,
          saldoIniziale: parseFloat(saldoIniziale) || 0,
          saldoFinale: saldoFinale ? parseFloat(saldoFinale) : undefined
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSaldoData(data)
      }
    } catch (error) {
      console.error('Errore nel salvataggio saldo:', error)
    } finally {
      setSaving(false)
    }
  }

  const aggiungiRicarica = async () => {
    if (!nuovaRicarica.importo || !currentSede) return
    
    try {
      const response = await fetch('/api/ricariche-droppoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: selectedDate,
          importo: parseFloat(nuovaRicarica.importo),
          descrizione: nuovaRicarica.descrizione,
          turno: nuovaRicarica.turno,
          sede: currentSede.nome
        })
      })
      
      if (response.ok) {
        setNuovaRicarica({ importo: '', descrizione: '', turno: 'Mattina' })
        fetchSaldoData() // Ricarica i dati
      }
    } catch (error) {
      console.error('Errore nell&apos;aggiunta ricarica:', error)
    }
  }

  const eliminaRicarica = async (id: number) => {
    try {
      const response = await fetch(`/api/ricariche-droppoint?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchSaldoData() // Ricarica i dati
      }
    } catch (error) {
      console.error('Errore nell&apos;eliminazione ricarica:', error)
    }
  }

  useEffect(() => {
    fetchSaldoData()
  }, [selectedDate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="hover:bg-blue-50 border-blue-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gestione Saldo Droppoint
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">Saldo giornaliero e ricariche</p>
                {currentSede && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Sede: {currentSede.nome}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selezione Data */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              Selezione Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Data</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              <Button 
                onClick={fetchSaldoData}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Carica Dati
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
              <DollarSign className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Caricamento Dati</h3>
            <p className="text-gray-500">Recupero informazioni saldo...</p>
          </div>
        ) : (
          <>
            {/* Gestione Saldi */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <DollarSign className="w-5 h-5" />
                    Saldo Iniziale
                  </CardTitle>
                  <CardDescription>Saldo all&apos;apertura del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saldoIniziale}
                    onChange={(e) => setSaldoIniziale(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <Button 
                    onClick={salvaSaldo}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salva Saldo'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <DollarSign className="w-5 h-5" />
                    Saldo Finale
                  </CardTitle>
                  <CardDescription>Saldo a fine giornata (opzionale)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saldoFinale}
                    onChange={(e) => setSaldoFinale(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <Button 
                    onClick={salvaSaldo}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salva Saldo'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Riepilogo Saldi */}
            {saldoData && (
              <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Riepilogo Saldi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{formatCurrency(saldoData.saldoIniziale)}</div>
                      <div className="text-purple-100">Saldo Iniziale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{formatCurrency(saldoData.totaleRicariche)}</div>
                      <div className="text-purple-100">Totale Ricariche</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold">{formatCurrency(saldoData.saldoTotale)}</div>
                      <div className="text-purple-100">Saldo Teorico</div>
                    </div>
                    {saldoData.saldoFinale !== null && saldoData.saldoFinale !== undefined && (
                      <div className="text-center">
                        <div className="text-3xl font-bold">{formatCurrency(saldoData.saldoFinale)}</div>
                        <div className="text-purple-100">Saldo Finale</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Calcolo Saldo Utilizzato */}
                  {saldoData.saldoFinale !== null && saldoData.saldoFinale !== undefined && (
                    <div className="mt-8 pt-6 border-t border-purple-300">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-100 mb-2">Analisi Utilizzo Saldo</div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-white/10 rounded-lg p-4">
                            <div className="text-2xl font-bold">
                              {formatCurrency(saldoData.saldoTotale - (saldoData.saldoFinale || 0))}
                            </div>
                            <div className="text-sm text-purple-100">Saldo Utilizzato</div>
                            <div className="text-xs text-purple-200 mt-1">
                              (Teorico - Finale)
                            </div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-4">
                            <div className="text-2xl font-bold">
                              {((saldoData.saldoTotale - (saldoData.saldoFinale || 0)) / saldoData.saldoTotale * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-purple-100">Percentuale Utilizzata</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-4">
                            <div className={`text-2xl font-bold ${
                              Math.abs(saldoData.saldoTotale - (saldoData.saldoFinale || 0)) < 0.01 
                                ? 'text-green-300' 
                                : saldoData.saldoTotale > (saldoData.saldoFinale || 0) 
                                  ? 'text-yellow-300' 
                                  : 'text-red-300'
                            }`}>
                              {Math.abs(saldoData.saldoTotale - (saldoData.saldoFinale || 0)) < 0.01 
                                ? '✓ Corretto' 
                                : saldoData.saldoTotale > (saldoData.saldoFinale || 0) 
                                  ? '⚠ Utilizzato' 
                                  : '⚠ Anomalia'
                              }
                            </div>
                            <div className="text-sm text-purple-100">Stato</div>
                            <div className="text-xs text-purple-200 mt-1">
                              {Math.abs(saldoData.saldoTotale - (saldoData.saldoFinale || 0)) < 0.01 
                                ? 'Nessun utilizzo' 
                                : saldoData.saldoTotale > (saldoData.saldoFinale || 0) 
                                  ? 'Saldo consumato' 
                                  : 'Saldo finale > teorico'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Spiegazione Calcolo Utilizzo */}
            {saldoData && saldoData.saldoFinale !== null && saldoData.saldoFinale !== undefined && (
              <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <DollarSign className="w-5 h-5" />
                    Come Funziona il Calcolo
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Spiegazione del calcolo dell&apos;utilizzo del saldo Droppoint
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800">📊 Calcolo del Saldo Teorico</h4>
                      <div className="text-sm text-gray-700 space-y-2">
                        <p><strong>Saldo Teorico</strong> = Saldo Iniziale + Ricariche</p>
                        <p>Questo rappresenta quanto saldo dovrebbe essere disponibile nel sistema.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800">🔍 Calcolo dell&apos;Utilizzo</h4>
                      <div className="text-sm text-gray-700 space-y-2">
                        <p><strong>Saldo Utilizzato</strong> = Saldo Teorico - Saldo Finale</p>
                        <p>Questo mostra quanto saldo è stato effettivamente consumato durante la giornata.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Interpretazione dei Risultati</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="text-green-600 font-semibold">✓ Corretto:</span> Il saldo finale corrisponde al teorico (nessun utilizzo)</p>
                      <p><span className="text-yellow-600 font-semibold">⚠ Utilizzato:</span> Il saldo è stato consumato normalmente</p>
                      <p><span className="text-red-600 font-semibold">⚠ Anomalia:</span> Il saldo finale è maggiore del teorico (possibile errore)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aggiungi Ricarica */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Aggiungi Ricarica
                </CardTitle>
                <CardDescription>Aggiungi una ricarica al saldo Droppoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Importo (€)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={nuovaRicarica.importo}
                      onChange={(e) => setNuovaRicarica({...nuovaRicarica, importo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Descrizione</label>
                    <Input
                      placeholder="Descrizione ricarica"
                      value={nuovaRicarica.descrizione}
                      onChange={(e) => setNuovaRicarica({...nuovaRicarica, descrizione: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Turno</label>
                    <select 
                      value={nuovaRicarica.turno}
                      onChange={(e) => setNuovaRicarica({...nuovaRicarica, turno: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2"
                    >
                      <option value="Mattina">Mattina</option>
                      <option value="Pomeriggio">Pomeriggio</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={aggiungiRicarica}
                      disabled={!nuovaRicarica.importo || !currentSede}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista Ricariche */}
            {saldoData && saldoData.ricariche.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ricariche del Giorno</CardTitle>
                  <CardDescription>Elenco delle ricariche effettuate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {saldoData.ricariche.map((ricarica) => (
                      <div key={ricarica.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{formatCurrency(ricarica.importo)}</div>
                            <div className="text-sm text-gray-600">
                              {ricarica.descrizione || 'Ricarica senza descrizione'}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ricarica.turno}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {ricarica.sede}
                              </span>
                              <span>
                                {new Date(ricarica.createdAt).toLocaleString('it-IT')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => eliminaRicarica(ricarica.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}