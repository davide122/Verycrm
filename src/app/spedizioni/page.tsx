'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Package, Truck, Scale, Shield, TrendingUp, Star, Award, Activity, CheckCircle, Calculator, Layers, Box, Settings, CreditCard, Banknote, Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, calcolaPrezzo } from '@/lib/utils'
import { useSede } from '@/hooks/useSede'
interface Spedizione {
  id: number
  peso: number
  pellicola: boolean
  quantitaPellicole: number
  imballaggio: boolean
  quantitaImballaggi: number
  prezzoPoste: number
  iva: number
  rimborsoSpese: number
  prezzoCliente: number
  guadagno: number
  turno: string
  sede: string
  metodoPagamento: string
  createdAt: string
  nominativoMittente?: string
}

export default function SpedizioniPage() {
  const { currentSede } = useSede()
  const [spedizioni, setSpedizioni] = useState<Spedizione[]>([])
  const [peso, setPeso] = useState('')
  const [pellicola, setPellicola] = useState(false)
  const [quantitaPellicole, setQuantitaPellicole] = useState(1)
  const [imballaggio, setImballaggio] = useState(false)
  const [quantitaImballaggi, setQuantitaImballaggi] = useState(1)
  const [metodoPagamento, setMetodoPagamento] = useState('CONTANTI')
  const [nominativoMittente, setNominativoMittente] = useState('')
  const [editingSpedizione, setEditingSpedizione] = useState<Spedizione | null>(null)
  const [editPeso, setEditPeso] = useState('')
  const [editPellicola, setEditPellicola] = useState('')
  const [editImballaggio, setEditImballaggio] = useState('')
  const [editMetodoPagamento, setEditMetodoPagamento] = useState('CONTANTI')
  const [editNominativoMittente, setEditNominativoMittente] = useState('')
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
    if (currentSede) {
      fetchSpedizioni()
    }
  }, [currentSede])

  useEffect(() => {
    if (peso) {
      const pesoNum = parseFloat(peso)
      if (pesoNum > 0) {
        const calcolo = calcolaPrezzo(pesoNum, pellicola, imballaggio, quantitaPellicole, quantitaImballaggi)
        setPrezzoCalcolato(calcolo)
      } else {
        setPrezzoCalcolato(null)
      }
    } else {
      setPrezzoCalcolato(null)
    }
  }, [peso, pellicola, imballaggio, quantitaPellicole, quantitaImballaggi])

  const fetchSpedizioni = async () => {
    try {
      // Verifica che currentSede sia valido prima di fare la chiamata
      if (!currentSede?.id) {
        console.warn('Sede non valida, non carico spedizioni')
        setSpedizioni([])
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/spedizioni?data=${today}&sede=${currentSede.id}`)
      
      if (response.ok) {
        const spedizioniData = await response.json()
        // Filtraggio aggiuntivo lato client per sicurezza
        const spedizioniFiltrate = spedizioniData.filter((spedizione: Spedizione) => 
          spedizione.sede === currentSede.id
        )
        setSpedizioni(spedizioniFiltrate)
      } else {
        setSpedizioni([])
      }
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
      const response = await fetch('/api/spedizioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peso: parseFloat(peso),
          pellicola,
          quantitaPellicole,
          imballaggio,
          quantitaImballaggi,
          metodoPagamento,
          sede: currentSede?.id,
          nominativoMittente: nominativoMittente.trim() || null
        })
      })

      if (response.ok) {
        const nuovaSpedizione = await response.json()
        // Ricarica le spedizioni dal database per assicurare sincronizzazione
        await fetchSpedizioni()
        setPeso('')
        setPellicola(false)
        setQuantitaPellicole(1)
        setImballaggio(false)
        setQuantitaImballaggi(1)
        setMetodoPagamento('CONTANTI')
        setNominativoMittente('')
        setPrezzoCalcolato(null)
        alert(`Spedizione di ${parseFloat(peso)}kg registrata con successo!`)
      } else {
        throw new Error('Errore nella registrazione della spedizione')
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta della spedizione:', error)
      alert('Errore durante la registrazione della spedizione')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSpedizione = (spedizione: Spedizione) => {
    setEditingSpedizione(spedizione)
    setEditPeso(spedizione.peso.toString())
    setEditPellicola(spedizione.quantitaPellicole.toString())
    setEditImballaggio(spedizione.quantitaImballaggi.toString())
    setEditMetodoPagamento(spedizione.metodoPagamento)
    setEditNominativoMittente(spedizione.nominativoMittente || '')
  }

  const handleUpdateSpedizione = async () => {
    if (!editingSpedizione || !editPeso) return

    try {
      const response = await fetch(`/api/spedizioni/${editingSpedizione.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peso: parseFloat(editPeso),
          quantitaPellicole: parseInt(editPellicola) || 0,
          quantitaImballaggi: parseInt(editImballaggio) || 1,
          turno: editingSpedizione.turno,
          sede: currentSede?.id || editingSpedizione.sede,
          metodoPagamento: editMetodoPagamento,
          nominativoMittente: editNominativoMittente.trim() || null
        })
      })

      if (response.ok) {
        const spedizioneAggiornata = await response.json()
        setSpedizioni(spedizioni.map(s => 
          s.id === editingSpedizione.id ? spedizioneAggiornata : s
        ))
        setEditingSpedizione(null)
        setEditPeso('')
        setEditPellicola('')
        setEditImballaggio('')
        setEditMetodoPagamento('CONTANTI')
        setEditNominativoMittente('')
        alert('Spedizione modificata con successo!')
      } else {
        throw new Error('Errore nella modifica della spedizione')
      }
    } catch (error) {
      console.error('Errore nella modifica della spedizione:', error)
      alert('Errore durante la modifica della spedizione')
    }
  }

  const handleDeleteSpedizione = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa spedizione?')) return

    try {
      const response = await fetch(`/api/spedizioni/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSpedizioni(spedizioni.filter(s => s.id !== id))
        alert('Spedizione eliminata con successo!')
      } else {
        throw new Error('Errore nell\'eliminazione della spedizione')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della spedizione:', error)
      alert('Errore durante l\'eliminazione della spedizione')
    }
  }

  const cancelEditSpedizione = () => {
    setEditingSpedizione(null)
    setEditPeso('')
    setEditPellicola('')
    setEditImballaggio('')
    setEditMetodoPagamento('CONTANTI')
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
              Spedizioni Express
            </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">Sistema avanzato gestione spedizioni</p>
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
            <Truck className="w-5 h-5 text-blue-500" />
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
                  <p className="text-gray-600 text-sm font-medium">Spedizioni</p>
                  <p className="text-2xl font-bold text-blue-900">{spedizioni.length}</p>
                </div>
                <Package className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Peso Medio</p>
                  <p className="text-2xl font-bold text-blue-900">{pesoMedio}kg</p>
                </div>
                <Scale className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form per aggiungere spedizione - Migliorato */}
          <Card className="lg:col-span-2 bg-white border border-gray-200">
            <CardHeader className="bg-blue-900 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-900" />
                </div>
                Nuova Spedizione
              </CardTitle>
              <CardDescription className="text-blue-100">
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

                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Nominativo Mittente (opzionale)
                  </label>
                  <Input
                    type="text"
                    value={nominativoMittente}
                    onChange={(e) => setNominativoMittente(e.target.value)}
                    placeholder="Es. Mario Rossi"
                    className="h-12 border-2 border-gray-200 hover:border-orange-400 transition-colors text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Servizi Aggiuntivi
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
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
                      {pellicola && (
                        <div className="ml-8">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Quantità Pellicole</label>
                          <Select value={quantitaPellicole.toString()} onValueChange={(value) => setQuantitaPellicole(parseInt(value))}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              <SelectItem value="1">x1</SelectItem>
                              <SelectItem value="2">x2</SelectItem>
                              <SelectItem value="3">x3</SelectItem>
                              <SelectItem value="4">x4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
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
                      {imballaggio && (
                        <div className="ml-8">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Quantità Imballaggi</label>
                          <Select value={quantitaImballaggi.toString()} onValueChange={(value) => setQuantitaImballaggi(parseInt(value))}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              <SelectItem value="1">x1</SelectItem>
                              <SelectItem value="2">x2</SelectItem>
                              <SelectItem value="3">x3</SelectItem>
                              <SelectItem value="4">x4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Metodo di Pagamento
                  </label>
                  <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-orange-400 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="CONTANTI">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-green-600" />
                          <span>Contanti</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="POS">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>POS/Carta</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                  className="w-full h-14 bg-blue-900 hover:bg-blue-800 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
          <Card className="bg-white border border-gray-200">
            <CardHeader className="bg-blue-900 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-900" />
                </div>
                Dashboard Live
              </CardTitle>
              <CardDescription className="text-blue-100">
                {mounted && currentTime ? formatDate(currentTime) : 'Caricamento...'} • {greeting}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">💰 Entrate Totali</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {formatCurrency(totaleGiornata.entrate)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">💸 Costi Totali</span>
                    <span className="text-2xl font-bold text-yellow-700">
                      {formatCurrency(totaleGiornata.costi)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">🎯 Guadagno Netto</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {formatCurrency(totaleGiornata.guadagni)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">📊 Margine</span>
                    <span className="text-2xl font-bold text-yellow-700">
                      {marginePercentuale}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">📦 Spedizioni</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {spedizioni.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista spedizioni - Migliorata */}
        <Card className="mt-8 bg-white border border-gray-200">
          <CardHeader className="bg-blue-900 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-900" />
              </div>
              Registro Spedizioni Live
            </CardTitle>
            <CardDescription className="text-blue-100">
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
                      <div className="absolute top-4 left-4 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      {editingSpedizione?.id === spedizione.id ? (
                        // Modalità modifica
                        <div className="ml-12 space-y-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Modifica Spedizione</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                              <Input
                                type="number"
                                step="0.1"
                                value={editPeso}
                                onChange={(e) => setEditPeso(e.target.value)}
                                className="w-full"
                                min="0.1"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nominativo Mittente</label>
                              <Input
                                type="text"
                                value={editNominativoMittente}
                                onChange={(e) => setEditNominativoMittente(e.target.value)}
                                className="w-full"
                                placeholder="Nome del mittente"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Metodo Pagamento</label>
                              <Select value={editMetodoPagamento} onValueChange={setEditMetodoPagamento}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONTANTI">Contanti</SelectItem>
                                  <SelectItem value="POS">POS</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Pellicole</label>
                              <Input
                                type="number"
                                value={editPellicola}
                                onChange={(e) => setEditPellicola(e.target.value)}
                                className="w-full"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Imballaggi</label>
                              <Input
                                type="number"
                                value={editImballaggio}
                                onChange={(e) => setEditImballaggio(e.target.value)}
                                className="w-full"
                                min="0"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditSpedizione}
                            >
                              Annulla
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateSpedizione}
                              disabled={!editPeso}
                            >
                              Salva
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modalità visualizzazione
                        <div className="ml-12">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Scale className="w-5 h-5 text-yellow-500" />
                                <span className="text-2xl font-bold text-gray-800">{spedizione.peso}kg</span>
                              </div>
                              
                              {spedizione.nominativoMittente && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Mittente:</span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                    {spedizione.nominativoMittente}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex gap-2 flex-wrap">
                                {spedizione.pellicola && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    <Layers className="w-3 h-3" />
                                    Pellicola x{spedizione.quantitaPellicole}
                                  </span>
                                )}
                                {spedizione.imballaggio && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                    <Box className="w-3 h-3" />
                                    Imballaggio x{spedizione.quantitaImballaggi}
                                  </span>
                                )}
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                  spedizione.metodoPagamento === 'CONTANTI' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {spedizione.metodoPagamento === 'CONTANTI' ? (
                                    <Banknote className="w-3 h-3" />
                                  ) : (
                                    <CreditCard className="w-3 h-3" />
                                  )}
                                  {spedizione.metodoPagamento === 'CONTANTI' ? 'Contanti' : 'POS'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSpedizione(spedizione)}
                                  className="p-1 h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSpedizione(spedizione.id)}
                                  className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-900 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-900">Prezzo Cliente</span>
                            </div>
                            <p className="text-xl font-bold text-blue-900">{formatCurrency(spedizione.prezzoCliente)}</p>
                          </div>
                          
                          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm font-medium text-yellow-700">Guadagno</span>
                            </div>
                            <p className="text-xl font-bold text-yellow-700">{formatCurrency(spedizione.guadagno)}</p>
                          </div>
                          
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-900 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-900">Rimborso</span>
                            </div>
                            <p className="text-xl font-bold text-blue-900">{formatCurrency(spedizione.rimborsoSpese)}</p>
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
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-semibold">
                                {((spedizione.guadagno / spedizione.prezzoCliente) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        </div>
                      )}
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