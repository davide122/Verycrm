'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, FileText, BarChart3, Clock, TrendingUp, Users, Calendar, Star, ArrowRight, Zap, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { useSede } from '@/hooks/useSede'

export default function Home() {
  const { currentSede, isLoading, loadData } = useSede()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [stats, setStats] = useState({ servizi: 0, spedizioni: 0, guadagno: 0, entrate: 0, costi: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Carica dati reali da localStorage specifici per sede
    const loadRealData = () => {
      if (!currentSede) return
      
      try {
        // Carica servizi effettuati per la sede corrente
        const servizi = loadData('servizi')
        
        // Carica spedizioni effettuate per la sede corrente
        const spedizioni = loadData('spedizioni')
        
        // Calcola totali servizi
        const totaliServizi = servizi.reduce((acc: { entrate: number; costi: number; guadagno: number }, servizio: { prezzoCliente?: number; costoTotale?: number; guadagno?: number }) => {
          acc.entrate += servizio.prezzoCliente || 0
          acc.costi += servizio.costoTotale || 0
          acc.guadagno += servizio.guadagno || 0
          return acc
        }, { entrate: 0, costi: 0, guadagno: 0 })
        
        // Calcola totali spedizioni
        const totaliSpedizioni = spedizioni.reduce((acc: { entrate: number; costi: number; guadagno: number }, spedizione: { prezzoCliente?: number; rimborsoSpese?: number; guadagno?: number }) => {
          acc.entrate += spedizione.prezzoCliente || 0
          acc.costi += spedizione.rimborsoSpese || 0
          acc.guadagno += spedizione.guadagno || 0
          return acc
        }, { entrate: 0, costi: 0, guadagno: 0 })
        
        // Aggiorna stats con dati reali
        const newStats = {
          servizi: servizi.length,
          spedizioni: spedizioni.length,
          guadagno: totaliServizi.guadagno + totaliSpedizioni.guadagno,
          entrate: totaliServizi.entrate + totaliSpedizioni.entrate,
          costi: totaliServizi.costi + totaliSpedizioni.costi
        }
        
        setStats(prevStats => {
          // Solo aggiorna se i dati sono effettivamente cambiati
          if (JSON.stringify(prevStats) !== JSON.stringify(newStats)) {
            return newStats
          }
          return prevStats
        })
      } catch (error) {
        console.error('Errore nel caricamento dati:', error)
      }
    }
    
    if (mounted && currentSede) {
      loadRealData()
      // Aggiorna ogni 30 secondi
      const interval = setInterval(loadRealData, 30000)
      return () => clearInterval(interval)
    }
  }, [mounted, currentSede, loadData])

  const currentShift = currentTime && currentTime.getHours() < 14 ? 'Mattina' : 'Pomeriggio'
  const shiftTime = currentTime && currentTime.getHours() < 14 ? '8:30-13:00' : '16:00-19:00'
  const greeting = currentTime ? (currentTime.getHours() < 12 ? 'Buongiorno' : currentTime.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera') : 'Ciao'

  // Controlli condizionali dopo tutti gli hook
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!currentSede) {
    return null
  }

  const features = [
    {
      icon: FileText,
      title: 'Servizi Avanzati',
      description: 'Gestione completa di SPID, contratti e pratiche con tracking automatico',
      href: '/servizi',
      color: 'from-blue-500 to-cyan-500',
      stats: `${stats.servizi} servizi oggi`
    },
    {
      icon: Package,
      title: 'Spedizioni Smart',
      description: 'Calcolo automatico prezzi, tracking in tempo reale e gestione completa',
      href: '/spedizioni',
      color: 'from-purple-500 to-pink-500',
      stats: `${stats.spedizioni} spedizioni oggi`
    },
    {
      icon: BarChart3,
      title: 'Analytics Pro',
      description: 'Dashboard avanzata con insights, grafici e reportistica dettagliata',
      href: '/dashboard',
      color: 'from-green-500 to-emerald-500',
      stats: `${formatCurrency(stats.guadagno)} guadagno oggi`
    },
    {
      icon: Settings,
      title: 'Impostazioni',
      description: 'Configurazione sistema, preferenze utente e gestione avanzata',
      href: '/impostazioni',
      color: 'from-orange-500 to-red-500',
      stats: 'Personalizza tutto'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{greeting}! Sistema attivo</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-6 leading-tight">
              VeryPosta
              <span className="block text-4xl md:text-5xl font-bold text-gray-800">Tracker Pro</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              La piattaforma più avanzata per il tracking delle attività postali.
              <span className="block text-lg text-gray-500 mt-2">Gestione intelligente, analytics in tempo reale, automazione completa.</span>
            </p>

            {/* Status Bar */}
            <div className="inline-flex items-center gap-6 bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-white/20">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-800">{currentShift}</span>
                <span className="text-gray-500 text-sm">({shiftTime})</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Sistema Operativo</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-sm text-gray-600">
                {mounted && currentTime ? currentTime.toLocaleTimeString('it-IT') : '--:--:--'}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Operazioni Oggi</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.servizi + stats.spedizioni}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Entrate Giornaliere</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.entrate)}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Guadagno Netto</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.guadagno)}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Costi Totali</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.costi)}</p>
                </div>
                <Package className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Main Features */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  <CardHeader className="relative text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                    <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">{feature.stats}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative pt-0">
                    <Link href={feature.href}>
                      <Button className={`w-full bg-gradient-to-r ${feature.color} hover:shadow-lg transition-all duration-300 text-white font-semibold py-3 group-hover:scale-105`}>
                        <span>Accedi</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Bottom Section */}
          <div className="mt-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-2xl mx-auto">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Pianificazione Intelligente</h3>
              <p className="text-gray-600 mb-6">
                Il sistema ottimizza automaticamente i tuoi flussi di lavoro e suggerisce le migliori strategie operative.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">Auto-tracking</span>
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">Analytics AI</span>
                <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">Reportistica</span>
                <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">Automazione</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
