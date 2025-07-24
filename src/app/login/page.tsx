'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, Users, Shield, LucideIcon } from 'lucide-react'

interface Sede {
  id: string
  nome: string
  citta: string
  descrizione: string
  colore: string
  icona: LucideIcon
}

const sedi: Sede[] = [
  {
    id: 'aragona',
    nome: 'Ufficio Postale Aragona',
    citta: 'Aragona',
    descrizione: 'Sede principale - Gestione servizi completi',
    colore: 'from-blue-500 to-cyan-500',
    icona: Building2
  },
  {
    id: 'porto-empedocle',
    nome: 'Ufficio Postale Porto Empedocle',
    citta: 'Porto Empedocle',
    descrizione: 'Sede secondaria - Servizi specializzati',
    colore: 'from-purple-500 to-pink-500',
    icona: MapPin
  }
]

export default function LoginPage() {
  const [selectedSede, setSelectedSede] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = (sedeId: string) => {
    // Salva la sede selezionata in localStorage
    localStorage.setItem('currentSede', sedeId)
    localStorage.setItem('loginTime', new Date().toISOString())
    
    // Salva anche nei cookie per il middleware
    document.cookie = `currentSede=${sedeId}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 giorni
    
    // Reindirizza alla homepage
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-700">Accesso Sicuro</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            VeryPosta Tracker
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Seleziona la tua sede di lavoro
          </p>
          <p className="text-gray-500">
            I dati verranno salvati separatamente per ogni ufficio
          </p>
        </div>

        {/* Selezione Sede */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {sedi.map((sede) => {
            const Icona = sede.icona
            const isSelected = selectedSede === sede.id
            
            return (
              <Card 
                key={sede.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-white/90 hover:border-blue-300'
                }`}
                onClick={() => setSelectedSede(sede.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${sede.colore} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icona className="w-10 h-10 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                    {sede.nome}
                  </CardTitle>
                  
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 font-medium">{sede.citta}</span>
                  </div>
                  
                  <CardDescription className="text-gray-600 text-base">
                    {sede.descrizione}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLogin(sede.id)
                    }}
                    className={`w-full bg-gradient-to-r ${sede.colore} hover:shadow-lg transition-all duration-300 text-white font-semibold py-3 group-hover:scale-105`}
                    disabled={!isSelected}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Accedi come {sede.citta}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Footer */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-800">Sistema Sicuro</span>
            </div>
            <p className="text-gray-600 text-sm">
              Ogni sede mantiene i propri dati separati e sicuri. 
              Le statistiche e i report sono specifici per ogni ufficio postale.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}