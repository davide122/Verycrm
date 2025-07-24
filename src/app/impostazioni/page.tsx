'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PREZZI_SERVIZI, aggiornaPrezzoServizio, formatCurrency, SERVIZI_DISPONIBILI } from '@/lib/utils'
import { Settings, Save, RotateCcw, Euro, Calculator, TrendingUp, ArrowLeft } from 'lucide-react'
import { useSede } from '@/hooks/useSede'

export default function ImpostazioniPage() {
  const { currentSede, saveData, loadData } = useSede()
  const [prezziModificati, setPrezziModificati] = useState(PREZZI_SERVIZI)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    caricaImpostazioni()
  }, [currentSede])

  useEffect(() => {
    const isChanged = JSON.stringify(prezziModificati) !== JSON.stringify(PREZZI_SERVIZI)
    setHasChanges(isChanged)
  }, [prezziModificati])

  const handlePriceChange = (servizio: keyof typeof PREZZI_SERVIZI, campo: string, valore: string) => {
    const numeroValore = parseFloat(valore) || 0
    setPrezziModificati(prev => ({
      ...prev,
      [servizio]: {
        ...prev[servizio],
        [campo]: numeroValore
      }
    }))
  }

  const caricaImpostazioni = () => {
    try {
      // Carica impostazioni specifiche per sede
      const prezzi = loadData('prezzi_personalizzati')
      if (prezzi && Object.keys(prezzi).length > 0) {
        setPrezziModificati(prezzi)
      }
    } catch (error) {
      console.error('Errore nel caricamento impostazioni:', error)
    }
  }

  const salvaModifiche = () => {
    try {
      // Salva impostazioni specifiche per sede
      saveData('prezzi_personalizzati', prezziModificati)
      Object.entries(prezziModificati).forEach(([servizio, prezzi]) => {
        aggiornaPrezzoServizio(servizio as keyof typeof PREZZI_SERVIZI, prezzi)
      })
      setHasChanges(false)
      alert('Impostazioni salvate con successo!')
    } catch (error) {
      console.error('Errore nel salvataggio impostazioni:', error)
      alert('Errore nel salvataggio delle impostazioni')
    }
  }

  const ripristinaDefault = () => {
    setPrezziModificati(PREZZI_SERVIZI)
    setHasChanges(false)
    alert('Impostazioni ripristinate ai valori predefiniti')
  }

  const calcolaGuadagno = (servizio: typeof PREZZI_SERVIZI[keyof typeof PREZZI_SERVIZI]) => {
    const costoConIva = servizio.costoAzienda * (1 + servizio.iva)
    return servizio.prezzoCliente - costoConIva
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              Impostazioni Sistema
            </h1>
            <p className="text-muted-foreground">
              Configura i prezzi dei servizi e le impostazioni generali
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {hasChanges && (
            <Button onClick={ripristinaDefault} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Ripristina
            </Button>
          )}
          <Button 
            onClick={salvaModifiche} 
            disabled={!hasChanges}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="h-4 w-4" />
            Salva Modifiche
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Calculator className="h-5 w-5" />
            <span className="font-medium">Modifiche non salvate</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            Hai delle modifiche non salvate. Clicca su &quot;Salva Modifiche&quot; per applicarle.
          </p>
        </div>
      )}

      {/* Configurazione Prezzi Servizi */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-blue-600" />
            Configurazione Prezzi Servizi
          </CardTitle>
          <CardDescription>
            Modifica i prezzi di costo e vendita per ogni servizio offerto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6">
            {Object.entries(prezziModificati).map(([chiaveServizio, prezzi]) => {
              const servizioInfo = SERVIZI_DISPONIBILI.find(s => s.id === chiaveServizio)
              const guadagno = calcolaGuadagno(prezzi)
              
              return (
                <div key={chiaveServizio} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{servizioInfo?.nome || chiaveServizio}</h3>
                      <p className="text-sm text-muted-foreground">{servizioInfo?.descrizione}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium gap-1 flex items-center ${
                        guadagno > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                        Guadagno: {formatCurrency(guadagno)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <label htmlFor={`costo-${chiaveServizio}`} className="text-sm font-medium block">
                        Costo Azienda (€)
                      </label>
                      <Input
                        id={`costo-${chiaveServizio}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={prezzi.costoAzienda}
                        onChange={(e) => handlePriceChange(chiaveServizio as keyof typeof PREZZI_SERVIZI, 'costoAzienda', e.target.value)}
                        className="bg-white"
                      />
                      <p className="text-xs text-muted-foreground">
                        + IVA {(prezzi.iva * 100).toFixed(0)}% = {formatCurrency(prezzi.costoAzienda * (1 + prezzi.iva))}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`prezzo-${chiaveServizio}`} className="text-sm font-medium block">
                        Prezzo Cliente (€)
                      </label>
                      <Input
                        id={`prezzo-${chiaveServizio}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={prezzi.prezzoCliente}
                        onChange={(e) => handlePriceChange(chiaveServizio as keyof typeof PREZZI_SERVIZI, 'prezzoCliente', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`iva-${chiaveServizio}`} className="text-sm font-medium block">
                        IVA (%)
                      </label>
                      <Input
                        id={`iva-${chiaveServizio}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={(prezzi.iva * 100).toFixed(0)}
                        onChange={(e) => handlePriceChange(chiaveServizio as keyof typeof PREZZI_SERVIZI, 'iva', (parseFloat(e.target.value) / 100).toString())}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  
                  {chiaveServizio !== Object.keys(prezziModificati)[Object.keys(prezziModificati).length - 1] && (
                    <hr className="my-4 border-gray-200" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Riepilogo Margini */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Riepilogo Margini di Guadagno
          </CardTitle>
          <CardDescription>
            Panoramica dei margini di profitto per ogni servizio
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(prezziModificati).map(([chiaveServizio, prezzi]) => {
              const servizioInfo = SERVIZI_DISPONIBILI.find(s => s.id === chiaveServizio)
              const guadagno = calcolaGuadagno(prezzi)
              const marginePercentuale = prezzi.prezzoCliente > 0 ? (guadagno / prezzi.prezzoCliente) * 100 : 0
              
              return (
                <div key={chiaveServizio} className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50">
                  <h4 className="font-semibold text-sm">{servizioInfo?.nome}</h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Prezzo:</span>
                      <span className="font-medium">{formatCurrency(prezzi.prezzoCliente)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Costo:</span>
                      <span className="font-medium">{formatCurrency(prezzi.costoAzienda * (1 + prezzi.iva))}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Guadagno:</span>
                      <span className={guadagno > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(guadagno)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Margine:</span>
                      <span className={marginePercentuale > 0 ? 'text-green-600' : 'text-red-600'}>
                        {marginePercentuale.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}