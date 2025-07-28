'use client'

import { useState, useEffect } from 'react'
import { useSede } from '@/hooks/useSede'
import { Building2, MapPin, LogOut, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const sediDisponibili = [
  {
    id: 'aragona',
    nome: 'Aragona',
    citta: 'Aragona'
  },
  {
    id: 'porto-empedocle',
    nome: 'Porto Empedocle',
    citta: 'Porto Empedocle'
  }
]

export default function Navbar() {
  const { currentSede, logout } = useSede()
  const [isChangingSede, setIsChangingSede] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const cambiareSede = (nuovaSedeId: string) => {
    if (nuovaSedeId === currentSede?.id) return
    
    setIsChangingSede(true)
    setIsAnimating(true)
    
    // Animazione di uscita
    setTimeout(() => {
      try {
        localStorage.setItem('currentSede', nuovaSedeId)
        // Ricarica la pagina per aggiornare la sede
        window.location.reload()
      } catch (error) {
        console.error('Errore nel cambio sede:', error)
        setIsChangingSede(false)
        setIsAnimating(false)
      }
    }, 300)
  }

  useEffect(() => {
    if (currentSede) {
      setIsAnimating(false)
    }
  }, [currentSede])

  if (!currentSede) {
    return null
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 shadow-2xl backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome App */}
          <div className={`flex items-center gap-3 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Building2 className="w-6 h-6 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl blur opacity-50 animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                VeryPosta Tracking
              </h1>
              <div className="flex items-center gap-1 text-xs text-purple-300">
                <Sparkles className="w-3 h-3" />
                <span>Sistema Gestionale</span>
              </div>
            </div>
          </div>

          {/* Sede Corrente e Menu */}
          <div className={`flex items-center gap-4 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
            {/* Informazioni Sede Corrente */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="relative">
                <MapPin className="w-4 h-4 text-blue-300" />
                {isChangingSede && (
                  <div className="absolute inset-0">
                    <RefreshCw className="w-4 h-4 text-blue-300 animate-spin" />
                  </div>
                )}
              </div>
              <span className="font-medium text-white text-sm">{currentSede.citta}</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            {/* Select per Cambio Sede */}
            <div className="flex items-center gap-3">
              <Select 
                value={currentSede.id} 
                onValueChange={cambiareSede}
                disabled={isChangingSede}
              >
                <SelectTrigger className="w-52 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-300" />
                    <SelectValue className="text-white" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30 backdrop-blur-sm">
                  {sediDisponibili.map((sede) => (
                    <SelectItem 
                      key={sede.id} 
                      value={sede.id}
                      className="text-white hover:bg-purple-600/30 focus:bg-purple-600/30"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-300" />
                        <div className="flex flex-col">
                          <span className="font-medium">{sede.citta}</span>
                          
                        </div>
                        {sede.id === currentSede.id && (
                          <div className="ml-2 w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Pulsante Logout */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="flex items-center gap-2 bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-300 shadow-lg backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}