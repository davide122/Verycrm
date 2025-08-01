'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calculator, 
  Euro, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Banknote,
  Package,
  Receipt,
  Clock,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react'

interface RiepilogoData {
  totaleGuadagni: number
  totaleCosti: number
  profittoNetto: number
  serviziEffettuati: Array<{
    id: string
    tipo: string
    prezzo: number
    metodoPagamento: string
    sede: string
  }>
  spedizioni: Array<{
    id: string
    destinatario: string
    prezzo: number
    metodoPagamento: string
    sede: string
  }>
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
}

interface SaldoDroppoint {
  id: string
  sede: string
  saldoIniziale: number
  ricariche: number
  saldoFinale: number
  saldoUtilizzato: number | null
  saldoTotale: number
  totaleRicariche: number
  percentualeUtilizzata: number | null
  createdAt: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export default function ChiusuraCassaUnificata() {
  const [tipoChiusura, setTipoChiusura] = useState<'mattina' | 'sera'>('sera')
  const [contantiTotali, setContantiTotali] = useState<string>('')
  const [riepilogo, setRiepilogo] = useState<RiepilogoData | null>(null)
  const [saldoDroppoint, setSaldoDroppoint] = useState<SaldoDroppoint | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  // Stato per i calcoli
  const [calcoli, setCalcoli] = useState<{
    entrateContantiTotali: number
    contantiInseriti: number
    saldoRimanente: number
    saldoDroppointTotale: number
    differenzaDroppoint: number
    corrispondenza: boolean
  } | null>(null)

  const caricaDati = async () => {
    setLoadingData(true)
    try {
      const oggi = new Date().toISOString().split('T')[0]
      
      // Carica riepilogo per entrambe le sedi
      const riepilogoRes = await fetch(`/api/riepilogo?sede=ENTRAMBE&data=${oggi}`)
      if (!riepilogoRes.ok) {
        throw new Error('Errore nel caricamento del riepilogo')
      }
      const riepilogoData = await riepilogoRes.json()
      setRiepilogo(riepilogoData)

      // Carica saldo droppoint per entrambe le sedi
      const saldoRes = await fetch(`/api/saldo-droppoint?sede=ENTRAMBE&data=${oggi}`)
      if (!saldoRes.ok) {
        throw new Error('Errore nel caricamento del saldo droppoint')
      }
      const saldoData = await saldoRes.json()
      setSaldoDroppoint(saldoData)
    } catch (error) {
      console.error('Errore nel caricamento dati:', error)
      alert('Errore nel caricamento dei dati. Riprova.')
    } finally {
      setLoadingData(false)
    }
  }

  // Carica i dati iniziali
  useEffect(() => {
    caricaDati()
  }, [])

  // Calcola tutto quando cambiano i dati
  useEffect(() => {
    if (contantiTotali && riepilogo && saldoDroppoint) {
      const contantiInseriti = parseFloat(contantiTotali) || 0
      const entrateContantiTotali = riepilogo.pagamenti.totaliContanti
      const saldoRimanente = contantiInseriti - entrateContantiTotali
      const saldoDroppointTotale = saldoDroppoint.saldoUtilizzato || 0
      const differenzaDroppoint = saldoRimanente - saldoDroppointTotale
      const corrispondenza = Math.abs(differenzaDroppoint) < 0.01 // Tolleranza di 1 centesimo

      setCalcoli({
        entrateContantiTotali,
        contantiInseriti,
        saldoRimanente,
        saldoDroppointTotale,
        differenzaDroppoint,
        corrispondenza
      })
    } else {
      setCalcoli(null)
    }
  }, [contantiTotali, riepilogo, saldoDroppoint])

  const eseguiChiusura = async () => {
    if (!contantiTotali || !calcoli) {
      alert('Inserisci il totale contanti per procedere con la chiusura')
      return
    }

    if (!calcoli.corrispondenza) {
      const conferma = confirm(
        `ATTENZIONE: Il saldo non corrisponde (differenza: ${formatCurrency(calcoli.differenzaDroppoint)}). Vuoi procedere comunque?`
      )
      if (!conferma) return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/chiusura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipoChiusura,
          sede: 'ENTRAMBE',
          contantiTotali: calcoli.contantiInseriti,
          riepilogo,
          saldoDroppoint,
          calcoli
        })
      })

      if (response.ok) {
        alert('✅ Chiusura completata con successo!')
        // Reset form
        setContantiTotali('')
        setCalcoli(null)
        caricaDati()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nella chiusura')
      }
    } catch (error) {
      console.error('Errore:', error)
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      alert(`❌ Errore durante la chiusura: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Caricamento dati...</h2>
          <p className="text-gray-600">Sto recuperando i dati per la chiusura</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chiusura Cassa Unificata
            </h1>
            <p className="text-gray-600 text-xl mt-2">
              Sistema completo per la gestione della chiusura di entrambe le sedi
            </p>
          </div>
        </div>
      </div>

      {/* Tipo Chiusura */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-800 text-xl">
            <Clock className="w-6 h-6" />
            Configurazione Chiusura
          </CardTitle>
          <CardDescription className="text-blue-600 text-lg">
            Seleziona il tipo di chiusura da effettuare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-12 justify-center">
            <label className="flex items-center gap-4 cursor-pointer group">
              <input 
                type="radio" 
                value="mattina" 
                checked={tipoChiusura === 'mattina'}
                onChange={(e) => setTipoChiusura(e.target.value as 'mattina' | 'sera')}
                className="w-6 h-6 text-blue-600"
              />
              <div className="flex items-center gap-3 group-hover:scale-105 transition-transform">
                <Sun className="w-6 h-6 text-yellow-500" />
                <span className="text-xl font-semibold text-gray-800">Chiusura Mattina</span>
              </div>
            </label>
            <label className="flex items-center gap-4 cursor-pointer group">
              <input 
                type="radio" 
                value="sera" 
                checked={tipoChiusura === 'sera'}
                onChange={(e) => setTipoChiusura(e.target.value as 'mattina' | 'sera')}
                className="w-6 h-6 text-blue-600"
              />
              <div className="flex items-center gap-3 group-hover:scale-105 transition-transform">
                <Moon className="w-6 h-6 text-blue-500" />
                <span className="text-xl font-semibold text-gray-800">Chiusura Sera</span>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Entrate Contanti Calcolate */}
      {riepilogo && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-800 text-xl">
              <Banknote className="w-6 h-6" />
              Entrate in Contanti - Entrambe le Sedi
            </CardTitle>
            <CardDescription className="text-green-600 text-lg">
              Totale automatico calcolato da tutti i servizi e spedizioni pagati in contanti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border-2 border-green-100 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="text-sm text-gray-600 mb-2 font-medium">Servizi Contanti</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(riepilogo.pagamenti.servizi.contanti)}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border-2 border-green-100 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="text-sm text-gray-600 mb-2 font-medium">Spedizioni Contanti</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(riepilogo.pagamenti.spedizioni.contanti)}
                </div>
              </div>
              <div className="bg-green-100 p-6 rounded-xl border-2 border-green-300 text-center shadow-lg">
                <div className="text-sm text-green-800 mb-2 font-bold">TOTALE ENTRATE CONTANTI</div>
                <div className="text-3xl font-bold text-green-900">
                  {formatCurrency(riepilogo.pagamenti.totaliContanti)}
                </div>
                <div className="text-xs text-green-700 mt-1">Da sottrarre dal totale contanti</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Contanti Totali */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-yellow-800 text-xl">
            <Euro className="w-6 h-6" />
            Contanti Totali Presenti
          </CardTitle>
          <CardDescription className="text-yellow-600 text-lg">
            Inserisci la somma di tutti i contanti presenti in entrambe le sedi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-lg mx-auto space-y-4">
            <Label htmlFor="contanti-totali" className="text-xl font-bold text-yellow-800 block text-center">
              Totale Contanti Fisici (€)
            </Label>
            <Input
              id="contanti-totali"
              type="number"
              step="0.01"
              placeholder="Es: 3000.00"
              value={contantiTotali}
              onChange={(e) => setContantiTotali(e.target.value)}
              className="text-3xl font-bold text-center h-20 text-yellow-900 bg-white border-3 border-yellow-300 shadow-lg"
            />
            <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
              <p className="text-sm text-yellow-800 text-center font-medium">
                <strong>Esempio:</strong> Se Aragona ha 1000€ e Porto Empedocle ha 2000€, inserisci <strong>3000€</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calcoli e Verifica */}
      {calcoli && (
        <Card className={`border-3 shadow-xl ${
          calcoli.corrispondenza 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
            : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-3 text-2xl ${
              calcoli.corrispondenza ? 'text-green-800' : 'text-red-800'
            }`}>
              {calcoli.corrispondenza ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
              Verifica Saldo e Droppoint
            </CardTitle>
            <CardDescription className={`text-lg font-medium ${
              calcoli.corrispondenza ? 'text-green-600' : 'text-red-600'
            }`}>
              {calcoli.corrispondenza 
                ? '✅ Perfetto! Il saldo corrisponde esattamente con il droppoint' 
                : '⚠️ Attenzione: c&apos;è una discrepanza tra il saldo calcolato e il droppoint'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Calcolo del Saldo */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-3">
                  📊 Calcolo del Saldo
                </h3>
                
                <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Contanti Inseriti</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calcoli.contantiInseriti)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Totale contanti fisici presenti</p>
                </div>
                
                <div className="bg-red-50 p-5 rounded-xl border-2 border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-800">Entrate Contanti</span>
                    <span className="text-2xl font-bold text-red-600">
                      -{formatCurrency(calcoli.entrateContantiTotali)}
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">Da servizi e spedizioni</p>
                </div>
                
                <div className="bg-purple-100 p-6 rounded-xl border-3 border-purple-300 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-800 text-lg">Saldo Rimanente</span>
                    <span className="text-3xl font-bold text-purple-900">
                      {formatCurrency(calcoli.saldoRimanente)}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mt-2 font-medium">
                    Questo è quello che dovrebbe rimanere in cassa dopo le vendite
                  </p>
                </div>
              </div>
              
              {/* Confronto con Droppoint */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-3">
                  🔍 Confronto con Droppoint
                </h3>
                
                <div className="bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-indigo-800">Saldo Droppoint Utilizzato</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(calcoli.saldoDroppointTotale)}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 mt-1">Saldo effettivamente consumato durante i turni</p>
                </div>
                
                <div className={`p-6 rounded-xl border-3 shadow-lg ${
                  calcoli.corrispondenza 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-bold text-lg ${
                      calcoli.corrispondenza ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Differenza
                    </span>
                    <div className="flex items-center gap-3">
                      {calcoli.differenzaDroppoint > 0 ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : calcoli.differenzaDroppoint < 0 ? (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                      <span className={`text-3xl font-bold ${
                        calcoli.corrispondenza ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {calcoli.differenzaDroppoint >= 0 ? '+' : ''}{formatCurrency(calcoli.differenzaDroppoint)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${
                    calcoli.corrispondenza ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {calcoli.differenzaDroppoint > 0 
                      ? 'Hai più soldi in cassa del previsto - Possibili entrate non registrate' 
                      : calcoli.differenzaDroppoint < 0
                      ? 'Mancano soldi in cassa - Verifica prelievi o errori di conteggio'
                      : 'Saldo perfettamente bilanciato - Tutto corretto!'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Spiegazione dettagliata per discrepanze */}
            {!calcoli.corrispondenza && (
              <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
                  <div className="text-red-800">
                    <h4 className="font-bold text-lg mb-3">🚨 Analisi della Discrepanza</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Situazione:</strong> Il saldo rimanente ({formatCurrency(calcoli.saldoRimanente)}) non corrisponde al saldo droppoint utilizzato ({formatCurrency(calcoli.saldoDroppointTotale)})</p>
                      <p><strong>Differenza:</strong> {formatCurrency(Math.abs(calcoli.differenzaDroppoint))}</p>
                      {calcoli.differenzaDroppoint > 0 ? (
                        <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-300 mt-3">
                          <p><strong>💰 Hai più soldi del previsto:</strong></p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Potrebbero esserci entrate non registrate nel sistema</li>
                            <li>Errori nel calcolo del droppoint</li>
                            <li>Ricariche droppoint non contabilizzate correttamente</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-orange-100 p-3 rounded-lg border border-orange-300 mt-3">
                          <p><strong>⚠️ Mancano soldi in cassa:</strong></p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Verifica se ci sono stati prelievi non registrati</li>
                            <li>Controlla errori nel conteggio dei contanti</li>
                            <li>Possibili spese operative non contabilizzate</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dettaglio Saldo Droppoint Unificato */}
      {saldoDroppoint && (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-800 text-xl">
              <Package className="w-6 h-6" />
              Saldo Droppoint Unificato
            </CardTitle>
            <CardDescription className="text-purple-600 text-lg">
              Sistema droppoint condiviso tra entrambe le sedi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-xl border-2 border-purple-100 shadow-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Saldo Iniziale</p>
                    <p className="font-bold text-lg text-purple-800">{formatCurrency(saldoDroppoint.saldoIniziale)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ricariche Totali</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(saldoDroppoint.totaleRicariche || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Saldo Teorico</p>
                    <p className="font-bold text-lg text-blue-600">{formatCurrency(saldoDroppoint.saldoTotale || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Saldo Utilizzato</p>
                    <p className="font-bold text-lg text-red-600">{formatCurrency(saldoDroppoint.saldoUtilizzato || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pulsante Chiusura */}
      <div className="flex justify-center pt-8">
        <Button 
          onClick={eseguiChiusura}
          disabled={loading || !contantiTotali || !calcoli}
          size="lg"
          className={`px-16 py-6 text-2xl font-bold rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            loading || !contantiTotali || !calcoli
              ? 'bg-gray-400 cursor-not-allowed'
              : calcoli?.corrispondenza
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin" />
              Elaborazione in corso...
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Receipt className="w-8 h-8" />
              {calcoli?.corrispondenza 
                ? `✅ Esegui Chiusura ${tipoChiusura === 'mattina' ? 'Mattina' : 'Sera'}` 
                : `⚠️ Esegui Chiusura con Discrepanza`
              }
            </div>
          )}
        </Button>
      </div>

      {/* Guida al Funzionamento */}
      <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">💡 Come Funziona la Chiusura Unificata</CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            Processo step-by-step per una chiusura corretta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-gray-800 border-b pb-2">🔢 Calcoli Automatici</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <p>Il sistema calcola automaticamente le <strong>entrate in contanti</strong> da servizi e spedizioni di entrambe le sedi</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <p>Tu inserisci il <strong>totale dei contanti fisici</strong> presenti (Aragona + Porto Empedocle)</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <p>Il sistema sottrae le entrate dai contanti totali per ottenere il <strong>&quot;saldo rimanente&quot;</strong></p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-gray-800 border-b pb-2">✅ Verifica Droppoint</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                  <p>Confronta il saldo rimanente con il <strong>saldo droppoint totale</strong> per verificare la corrispondenza</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</span>
                  <p>Se c&apos;è una differenza, significa che i soldi <strong>&quot;mancanti&quot;</strong> dal droppoint dovrebbero essere in cassa</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">6</span>
                  <p>Il sistema ti avvisa di eventuali <strong>discrepanze</strong> e ti permette di procedere comunque</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}