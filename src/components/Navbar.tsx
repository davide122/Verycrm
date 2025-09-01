'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSede } from '@/hooks/useSede'
import { Building2, MapPin, LogOut, RefreshCw, Sparkles, Menu, X, CheckSquare, Package, FileText, BarChart3, Calculator } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationLinks = [
    { href: '/servizi', label: 'Servizi', icon: FileText },
    { href: '/spedizioni', label: 'Spedizioni', icon: Package },
    { href: '/calcolatore-tariffe', label: 'Tariffe', icon: Calculator },
    { href: '/todolist', label: 'TodoList', icon: CheckSquare },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 }
  ]

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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo e Nome App */}
          <Link href="/" className={`flex items-center gap-2 sm:gap-3 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl blur opacity-50 animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                <span className="hidden sm:inline">VeryPosta Tracking</span>
                <span className="sm:hidden">VeryPosta</span>
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-xs text-purple-300">
                <Sparkles className="w-3 h-3" />
                <span>Sistema Gestionale</span>
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className={`hidden md:flex items-center gap-4 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              {navigationLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link key={link.href} href={link.href}>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 transition-all duration-300">
                      <Icon className="w-4 h-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
            
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
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {/* Sede corrente mobile */}
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <MapPin className="w-3 h-3 text-blue-300" />
              <span className="font-medium text-white text-xs">{currentSede.citta}</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10 p-2"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-t border-white/20 backdrop-blur-sm shadow-xl z-50">
          <div className="px-4 py-4 space-y-2">
            {/* Navigation Links */}
            {navigationLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-300">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              )
            })}
            
            {/* Divider */}
            <div className="border-t border-white/20 my-3"></div>
            
            {/* Cambio Sede Mobile */}
            <div className="px-3 py-2">
              <label className="text-white text-sm font-medium mb-2 block">Cambia Sede:</label>
              <Select 
                value={currentSede.id} 
                onValueChange={(value) => {
                  cambiareSede(value)
                  setIsMobileMenuOpen(false)
                }}
                disabled={isChangingSede}
              >
                <SelectTrigger className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
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
            </div>
            
            {/* Logout Mobile */}
            <div className="px-3 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  logout()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}