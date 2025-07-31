'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Package, 
  FileText, 
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  Euro,
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Eye,
  TrendingDown,
  Settings
} from 'lucide-react'
import { formatCurrency, formatDate, getTurnoCorrente } from '@/lib/utils'
import { useSede } from '@/hooks/useSede'
import { generateChiusuraReport } from '@/lib/pdfGenerator'

interface ServizioEffettuato {
  id: string
  servizioId: number
  quantita: number
  prezzoCliente: number
  costoTotale: number
  guadagno: number
  turno: string
  sede: string
  createdAt: string
  servizio: {
    nome: string
  }
}

interface Spedizione {
  id: string
  peso: number
  prezzoCliente: number
  guadagno: number
  rimborsoSpese: number
}

interface RiepilogoData {
  data: string
  turno?: string
  servizi: {
    lista: ServizioEffettuato[]
    totali: {
      entrate: number
      costi: number
      guadagni: number
      quantita: number
    }
  }
  spedizioni: {
    lista: Spedizione[]
    totali: {
      entrate: number
      costi: number
      guadagni: number
      quantita: number
    }
  }
  totali: {
    entrate: number
    costi: number
    guadagni: number
  }
  pagamenti: {
    servizi: {
      contanti: number
      pos: number
    }
    spedizioni: {
      contanti: number
      pos: number
    }
    totaliContanti: number
    totaliPos: number
  }
  speseOperative: {
    fabioBusta: number
    descrizione: string
  }
}

export default function DashboardPage() {
  const { currentSede } = useSede()
  const [riepilogo, setRiepilogo] = useState<RiepilogoData | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTurno, setSelectedTurno] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const fetchRiepilogo = async () => {
    setLoading(true)
    try {
      let url = `/api/riepilogo?data=${selectedDate}`
      if (selectedTurno && selectedTurno !== 'all') {
        url += `&turno=${selectedTurno}`
      }
      if (currentSede?.id) {
        url += `&sede=${currentSede.id}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      setRiepilogo(data)
    } catch (error) {
      console.error('Errore nel caricamento del riepilogo:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentSede) {
      fetchRiepilogo()
    }
  }, [selectedDate, selectedTurno, currentSede])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header migliorato */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="hover:bg-blue-50 border-blue-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">Monitoraggio avanzato delle performance</p>
                {currentSede && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Sede: {currentSede.nome}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRiepilogo}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                if (riepilogo && currentSede) {
                  generateChiusuraReport(riepilogo, currentSede, selectedDate, selectedTurno)
                }
              }}
              disabled={!riepilogo || !currentSede}
            >
              <Download className="w-4 h-4" />
              Stampa PDF
            </Button>
            <Link href="/impostazioni">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Impostazioni
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Entrate Oggi</p>
                  <p className="text-lg font-bold text-green-600">
                    {riepilogo ? formatCurrency(riepilogo.totali.entrate) : '€0,00'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guadagno</p>
                  <p className="text-lg font-bold text-blue-600">
                    {riepilogo ? formatCurrency(riepilogo.totali.guadagni) : '€0,00'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Operazioni</p>
                  <p className="text-lg font-bold text-purple-600">
                    {riepilogo ? (riepilogo.servizi.totali.quantita + riepilogo.spedizioni.totali.quantita) : '0'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Margine</p>
                  <p className="text-lg font-bold text-orange-600">
                    {riepilogo && riepilogo.totali.entrate > 0 ? 
                      `${((riepilogo.totali.guadagni / riepilogo.totali.entrate) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtri Avanzati */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Filter className="h-6 w-6" />
              </div>
              Centro Controllo Filtri
            </CardTitle>
            <CardDescription className="text-blue-100">
              Personalizza la visualizzazione dei dati per analisi dettagliate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Seleziona Data
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Turno di Lavoro
                </label>
                <Select value={selectedTurno} onValueChange={setSelectedTurno}>
                  <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg">
                    <SelectValue placeholder="Tutti i turni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌅 Tutti i turni</SelectItem>
                    <SelectItem value="mattina">🌅 Mattina (8:30-13:00)</SelectItem>
                    <SelectItem value="pomeriggio">🌆 Pomeriggio (16:00-19:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  Visualizzazione
                </label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-green-200 hover:bg-green-50"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Grafici
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-green-200 hover:bg-green-50"
                  >
                    <PieChart className="w-4 h-4 mr-1" />
                    Tabelle
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Elaborazione Dati</h3>
            <p className="text-gray-500">Caricamento delle analisi in corso...</p>
          </div>
        ) : riepilogo ? (
          <>
            {/* Performance Overview */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Performance Overview</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent"></div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-sm font-semibold text-green-700">
                        💰 Entrate Totali
                      </CardTitle>
                      <CardDescription className="text-green-600">
                        Ricavi giornalieri
                      </CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      {formatCurrency(riepilogo.totali.entrate)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">+12% vs ieri</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-sm font-semibold text-red-700">
                        📉 Costi Totali
                      </CardTitle>
                      <CardDescription className="text-red-600">
                        Spese operative
                      </CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700 mb-2">
                      {formatCurrency(riepilogo.totali.costi)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-600">-5% vs ieri</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-sm font-semibold text-blue-700">
                        🎯 Guadagno Netto
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Profitto finale
                      </CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700 mb-2">
                      {formatCurrency(riepilogo.totali.guadagni)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-600">+18% vs ieri</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Analisi Dettagliate */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Analisi per Categoria</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Servizi Avanzati */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                      </div>
                      Centro Servizi
                    </CardTitle>
                    <CardDescription className="text-emerald-100">
                      📋 {riepilogo.servizi.totali.quantita} servizi completati oggi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                        <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Euro className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-green-600 font-medium mb-1">Entrate</p>
                        <p className="font-bold text-green-700 text-lg">
                          {formatCurrency(riepilogo.servizi.totali.entrate)}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                        <div className="w-8 h-8 bg-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-red-600 font-medium mb-1">Costi</p>
                        <p className="font-bold text-red-700 text-lg">
                          {formatCurrency(riepilogo.servizi.totali.costi)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-blue-600 font-medium mb-1">Profitto</p>
                        <p className="font-bold text-blue-700 text-lg">
                          {formatCurrency(riepilogo.servizi.totali.guadagni)}
                        </p>
                      </div>
                    </div>

                    {riepilogo.servizi.lista.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800">🔥 Tutti i Servizi</h4>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                            {riepilogo.servizi.lista.length} servizi
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                          {riepilogo.servizi.lista.map((servizio: ServizioEffettuato, index: number) => (
                            <div key={servizio.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{servizio.servizio.nome}</p>
                                    <p className="text-sm text-gray-600">Quantità: {servizio.quantita} • Turno: {servizio.turno}</p>
                                    <p className="text-xs text-gray-500">{new Date(servizio.createdAt).toLocaleTimeString('it-IT')}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-emerald-600 text-lg">
                                    {formatCurrency(servizio.prezzoCliente)}
                                  </p>
                                  <p className="text-xs text-gray-500">Guadagno: {formatCurrency(servizio.guadagno)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Nessun servizio registrato</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Spedizioni Avanzate */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6" />
                      </div>
                      Centro Spedizioni
                    </CardTitle>
                    <CardDescription className="text-orange-100">
                      📦 {riepilogo.spedizioni.totali.quantita} spedizioni gestite oggi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                        <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Euro className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-green-600 font-medium mb-1">Entrate</p>
                        <p className="font-bold text-green-700 text-lg">
                          {formatCurrency(riepilogo.spedizioni.totali.entrate)}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                        <div className="w-8 h-8 bg-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-red-600 font-medium mb-1">Costi</p>
                        <p className="font-bold text-red-700 text-lg">
                          {formatCurrency(riepilogo.spedizioni.totali.costi)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-blue-600 font-medium mb-1">Profitto</p>
                        <p className="font-bold text-blue-700 text-lg">
                          {formatCurrency(riepilogo.spedizioni.totali.guadagni)}
                        </p>
                      </div>
                    </div>

                    {riepilogo.spedizioni.lista.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800">🚀 Tutte le Spedizioni</h4>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            {riepilogo.spedizioni.lista.length} spedizioni
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                          {riepilogo.spedizioni.lista.map((spedizione: Spedizione, index: number) => (
                            <div key={spedizione.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">Pacco {spedizione.peso}kg</p>
                                    <p className="text-sm text-gray-600">Rimborso spese: {formatCurrency(spedizione.rimborsoSpese || 0)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                   <p className="font-bold text-orange-600 text-lg">
                                     {formatCurrency(spedizione.prezzoCliente)}
                                   </p>
                                   <p className="text-xs text-gray-500">Guadagno: {formatCurrency(spedizione.guadagno)}</p>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Nessuna spedizione registrata</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Resoconto Pagamenti */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Resoconto Pagamenti</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-200 to-transparent"></div>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Contanti in Cassa */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Banknote className="h-6 w-6" />
                      </div>
                      Contanti in Cassa
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      💰 Totale incassi in contanti
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">Servizi</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(riepilogo.pagamenti.servizi.contanti)}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">Spedizioni</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(riepilogo.pagamenti.spedizioni.contanti)}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-green-800">TOTALE CONTANTI</span>
                          <Banknote className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-900">
                          {formatCurrency(riepilogo.pagamenti.totaliContanti)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pagamenti POS */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      Pagamenti POS
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      💳 Totale incassi con carta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">Servizi</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">
                          {formatCurrency(riepilogo.pagamenti.servizi.pos)}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">Spedizioni</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">
                          {formatCurrency(riepilogo.pagamenti.spedizioni.pos)}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4 border-2 border-blue-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-blue-800">TOTALE POS</span>
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(riepilogo.pagamenti.totaliPos)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Spese Operative Fabio Busta */}
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Receipt className="h-6 w-6" />
                      </div>
                      Fabio Busta
                    </CardTitle>
                    <CardDescription className="text-orange-100">
                      📋 Spese operative
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">Rimborsi Spedizioni</span>
                        </div>
                        <p className="text-sm text-orange-600 mb-2">
                          {riepilogo.speseOperative.descrizione}
                        </p>
                        <p className="text-2xl font-bold text-orange-800">
                          {formatCurrency(riepilogo.speseOperative.fabioBusta)}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 border-2 border-orange-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-orange-800">TOTALE SPESE</span>
                          <Receipt className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-900">
                          {formatCurrency(riepilogo.speseOperative.fabioBusta)}
                        </p>
                        <p className="text-xs text-orange-700 mt-2">
                          Costi operativi Poste Italiane
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs font-medium text-yellow-700">
                            Spese da rimborsare a Fabio
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Intelligence Center */}
            <Card className="mt-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  Intelligence Center
                </CardTitle>
                <CardDescription className="text-slate-200">
                  📊 Insights e metriche avanzate per ottimizzare le performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700">Periodo Analisi</p>
                        <p className="text-xs text-blue-600">Data selezionata</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-800">{formatDate(new Date(selectedDate))}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedTurno === 'all' ? '🌅 Tutti i turni' : 
                       selectedTurno === 'mattina' ? '🌅 Turno Mattina' : '🌆 Turno Pomeriggio'}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-700">Volume Operativo</p>
                        <p className="text-xs text-purple-600">Operazioni totali</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-purple-800">
                      {riepilogo.servizi.totali.quantita + riepilogo.spedizioni.totali.quantita}
                    </p>
                    <p className="text-sm text-purple-600 mt-1">
                      {riepilogo.servizi.totali.quantita} servizi + {riepilogo.spedizioni.totali.quantita} spedizioni
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-700">Margine Profitto</p>
                        <p className="text-xs text-green-600">ROI percentuale</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-800">
                      {riepilogo.totali.entrate > 0 ? 
                        `${((riepilogo.totali.guadagni / riepilogo.totali.entrate) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {riepilogo.totali.guadagni >= 0 ? '📈 Profittevole' : '📉 In perdita'}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-orange-700">Efficienza</p>
                        <p className="text-xs text-orange-600">Performance score</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-orange-800">
                      {riepilogo.totali.entrate > 0 ? 
                        `${Math.min(100, Math.round((riepilogo.totali.guadagni / riepilogo.totali.entrate) * 200))}%` : 
                        '0%'
                      }
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      {riepilogo.totali.guadagni > riepilogo.totali.costi ? '⚡ Ottimale' : '⚠️ Da migliorare'}
                    </p>
                  </div>
                </div>
                
                {/* Insights Avanzati */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Insights Intelligenti</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-blue-700">Analisi Trend</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        {riepilogo.servizi.totali.quantita > riepilogo.spedizioni.totali.quantita ? 
                          '📋 I servizi dominano oggi con maggiore volume operativo' :
                          '📦 Le spedizioni guidano le performance odierne'
                        }
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-green-700">Raccomandazione</span>
                      </div>
                      <p className="text-sm text-green-600">
                        {((riepilogo.totali.guadagni / riepilogo.totali.entrate) * 100) > 30 ? 
                          '🎯 Ottima performance! Mantieni questo ritmo' :
                          '💡 Considera di ottimizzare i costi per aumentare i margini'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Nessun dato disponibile per la data selezionata</p>
          </div>
        )}
      </div>
    </div>
  )
}