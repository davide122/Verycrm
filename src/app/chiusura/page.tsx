'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  Sun, 
  Moon, 
  MapPin, 
  Calculator, 
  Euro, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  Package,
  Receipt,
  Building2
} from 'lucide-react'
import { useSede } from '@/hooks/useSede'

interface RiepilogoData {
  totaleGuadagni: number
  totaleCosti: number
  profittoNetto: number
  serviziEffettuati: Array<{
    id: string
    tipo: string
    prezzo: number
    metodoPagamento: string
  }>
  spedizioni: Array<{
    id: string
    destinatario: string
    prezzo: number
    metodoPagamento: string
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
  speseOperative: {
    fabioBusta: number
    descrizione: string
  }
}

interface SaldoDroppoint {
  id: string
  sede: string
  saldoIniziale: number
  ricariche: number
  saldoFinale: number
  createdAt: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

export default function ChiusuraPage() {
  const [tipoChiusura, setTipoChiusura] = useState<'mattina' | 'sera'>('sera')
  const [contantiAragona, setContantiAragona] = useState<string>('')
  const [contantiPortoEmpedocle, setContantiPortoEmpedocle] = useState<string>('')
  const [riepilogo, setRiepilogo] = useState<RiepilogoData | null>(null)
  const [saldoDroppoint, setSaldoDroppoint] = useState<SaldoDroppoint[]>([])
  const [loading, setLoading] = useState(false)
  const [calcoloSaldo, setCalcoloSaldo] = useState<{
    contantiAragona: number
    contantiPortoEmpedocle: number
    contantiTotali: number
    entrateContanti: number
    saldoCalcolato: number
    saldoDroppointEffettivo: number
    differenza: number
    corrispondenza: boolean
  } | null>(null)

  const caricaDati = async () => {
    setLoading(true)
    try {
      const oggi = new Date().toISOString().split('T')[0]
      
      // Carica riepilogo per entrambe le sedi
      const riepilogoRes = await fetch(`/api/riepilogo?sede=ENTRAMBE&data=${oggi}`)
      const riepilogoData = await riepilogoRes.json()
      setRiepilogo(riepilogoData.riepilogo)

      // Carica saldo droppoint per entrambe le sedi
      const saldoRes = await fetch(`/api/saldo-droppoint?sede=ENTRAMBE&data=${oggi}`)
      const saldoData = await saldoRes.json()
      setSaldoDroppoint(saldoData.saldi || [])
    } catch (error) {
      console.error('Errore nel caricamento dati:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carica i dati iniziali
  useEffect(() => {
    caricaDati()
  }, [])

  // Calcola il saldo quando cambiano i contanti inseriti
  useEffect(() => {
    if (contantiAragona && contantiPortoEmpedocle && riepilogo && saldoDroppoint.length > 0) {
      const contantiAragonaNum = parseFloat(contantiAragona) || 0
      const contantiPortoEmpedocleNum = parseFloat(contantiPortoEmpedocle) || 0
      const contantiTotali = contantiAragonaNum + contantiPortoEmpedocleNum
      const entrateContanti = riepilogo.pagamenti.totaliContanti
      const saldoCalcolato = contantiTotali - entrateContanti
      
      // Calcola il saldo droppoint effettivo (somma di tutti i saldi finali)
      const saldoDroppointEffettivo = saldoDroppoint.reduce((sum, saldo) => sum + saldo.saldoFinale, 0)
      
      const differenza = saldoCalcolato - saldoDroppointEffettivo
      const corrispondenza = Math.abs(differenza) < 0.01 // Tolleranza di 1 centesimo

      setCalcoloSaldo({
        contantiAragona: contantiAragonaNum,
        contantiPortoEmpedocle: contantiPortoEmpedocleNum,
        contantiTotali,
        entrateContanti,
        saldoCalcolato,
        saldoDroppointEffettivo,
        differenza,
        corrispondenza
      })
    } else {
      setCalcoloSaldo(null)
    }
  }, [contantiAragona, contantiPortoEmpedocle, riepilogo, saldoDroppoint])

  const eseguiChiusura = async () => {
    if (!contantiAragona || !contantiPortoEmpedocle || !calcoloSaldo) {
      alert('Inserisci i contanti per entrambe le sedi per procedere')
      return
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
          contantiAragona: parseFloat(contantiAragona),
          contantiPortoEmpedocle: parseFloat(contantiPortoEmpedocle),
          contantiTotali: calcoloSaldo.contantiTotali,
          riepilogo,
          saldoDroppoint,
          calcoloSaldo
        })
      })

      if (response.ok) {
        alert('Chiusura completata con successo!')
        // Reset form
        setContantiAragona('')
        setContantiPortoEmpedocle('')
        setCalcoloSaldo(null)
        caricaDati()
      } else {
        throw new Error('Errore nella chiusura')
      }
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore durante la chiusura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Chiusura Cassa Unificata
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Sistema completo di chiusura con verifica saldo drop point
        </p>
      </div>

      {/* Configurazione Chiusura */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Clock className="w-5 h-5" />
            Configurazione Chiusura
          </CardTitle>
          <CardDescription className="text-blue-600">
            Seleziona il tipo di chiusura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo Chiusura */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-blue-800">Tipo Chiusura</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  value="mattina" 
                  id="mattina" 
                  checked={tipoChiusura === 'mattina'}
                  onChange={(e) => setTipoChiusura(e.target.value as 'mattina' | 'sera')}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="mattina" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  Chiusura Mattina
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  value="sera" 
                  id="sera" 
                  checked={tipoChiusura === 'sera'}
                  onChange={(e) => setTipoChiusura(e.target.value as 'mattina' | 'sera')}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="sera" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="w-4 h-4 text-blue-500" />
                  Chiusura Sera
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inserimento Contanti per Sede */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Euro className="w-5 h-5" />
            Contanti per Sede
          </CardTitle>
          <CardDescription className="text-green-600">
            Inserisci l&apos;importo dei contanti presenti in ogni sede
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="contanti-aragona" className="text-sm font-medium text-green-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Contanti Aragona (€)
                </div>
              </Label>
              <Input
                id="contanti-aragona"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={contantiAragona}
                onChange={(e) => setContantiAragona(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="contanti-porto" className="text-sm font-medium text-green-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Contanti Porto Empedocle (€)
                </div>
              </Label>
              <Input
                id="contanti-porto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={contantiPortoEmpedocle}
                onChange={(e) => setContantiPortoEmpedocle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
          </div>
          {contantiAragona && contantiPortoEmpedocle && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg border-2 border-green-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-green-800">TOTALE CONTANTI INSERITI</span>
                <span className="text-xl font-bold text-green-900">
                  {formatCurrency((parseFloat(contantiAragona) || 0) + (parseFloat(contantiPortoEmpedocle) || 0))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riepilogo Entrate Contanti */}
      {riepilogo && (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Banknote className="w-5 h-5" />
              Entrate in Contanti (Entrambe le Sedi)
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Totale delle entrate in contanti da servizi e spedizioni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm font-medium">Servizi in Contanti</span>
                <span className="font-semibold">{formatCurrency(riepilogo.pagamenti.servizi.contanti)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm font-medium">Spedizioni in Contanti</span>
                <span className="font-semibold">{formatCurrency(riepilogo.pagamenti.spedizioni.contanti)}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                <span className="font-bold text-yellow-800">TOTALE ENTRATE CONTANTI</span>
                <span className="text-xl font-bold text-yellow-900">{formatCurrency(riepilogo.pagamenti.totaliContanti)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calcolo e Verifica Saldo */}
      {calcoloSaldo && (
        <Card className={`border-2 ${
          calcoloSaldo.corrispondenza 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
            : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              calcoloSaldo.corrispondenza ? 'text-green-800' : 'text-red-800'
            }`}>
              {calcoloSaldo.corrispondenza ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              Verifica Saldo Droppoint
            </CardTitle>
            <CardDescription className={calcoloSaldo.corrispondenza ? 'text-green-600' : 'text-red-600'}>
              {calcoloSaldo.corrispondenza 
                ? '✅ Il saldo corrisponde perfettamente!' 
                : '⚠️ Attenzione: il saldo non corrisponde'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calcolo Saldo */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Calcolo Saldo Teorico</h4>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Contanti Aragona</span>
                  <span className="font-semibold">{formatCurrency(calcoloSaldo.contantiAragona)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Contanti Porto Empedocle</span>
                  <span className="font-semibold">{formatCurrency(calcoloSaldo.contantiPortoEmpedocle)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border">
                  <span className="text-sm font-medium">Totale Contanti</span>
                  <span className="font-semibold">{formatCurrency(calcoloSaldo.contantiTotali)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border">
                  <span className="text-sm font-medium">Entrate Contanti</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(calcoloSaldo.entrateContanti)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                  <span className="font-bold text-blue-800">Saldo Teorico</span>
                  <span className="text-xl font-bold text-blue-900">{formatCurrency(calcoloSaldo.saldoCalcolato)}</span>
                </div>
              </div>
              
              {/* Confronto con Droppoint */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Confronto Droppoint</h4>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Saldo Droppoint Effettivo</span>
                  <span className="font-semibold">{formatCurrency(calcoloSaldo.saldoDroppointEffettivo)}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                  calcoloSaldo.corrispondenza 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <span className={`font-bold ${
                    calcoloSaldo.corrispondenza ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Differenza
                  </span>
                  <div className="flex items-center gap-2">
                    {calcoloSaldo.differenza > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : calcoloSaldo.differenza < 0 ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    <span className={`text-xl font-bold ${
                      calcoloSaldo.corrispondenza ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {calcoloSaldo.differenza >= 0 ? '+' : ''}{formatCurrency(calcoloSaldo.differenza)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!calcoloSaldo.corrispondenza && (
              <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-red-800">
                    <strong>Attenzione:</strong> Il saldo teorico non corrisponde al saldo droppoint. 
                    {calcoloSaldo.differenza > 0 
                      ? 'Ci sono più soldi in cassa del previsto.' 
                      : 'Mancano soldi in cassa rispetto al previsto.'
                    } Verifica i contanti inseriti o controlla eventuali discrepanze.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dettaglio Saldo Droppoint */}
      {saldoDroppoint && saldoDroppoint.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Package className="w-5 h-5" />
              Dettaglio Saldo Droppoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {saldoDroppoint.map((saldo) => (
                <div key={saldo.id} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <div>
                    <span className="font-medium">{saldo.sede}</span>
                    <p className="text-xs text-gray-500">{formatDateTime(saldo.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(saldo.saldoFinale)}</span>
                    <p className="text-xs text-gray-500">Ricariche: {formatCurrency(saldo.ricariche)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg border-2 border-purple-300">
                <span className="font-bold text-purple-800">TOTALE SALDO DROPPOINT</span>
                <span className="text-xl font-bold text-purple-900">
                  {formatCurrency(saldoDroppoint.reduce((sum, saldo) => sum + saldo.saldoFinale, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pulsante Chiusura */}
      <div className="flex justify-center">
        <Button 
          onClick={eseguiChiusura}
          disabled={loading || !contantiAragona || !contantiPortoEmpedocle || !calcoloSaldo}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Elaborazione...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Esegui Chiusura {tipoChiusura === 'mattina' ? 'Mattina' : 'Sera'}
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}