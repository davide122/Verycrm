'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Calculator, Package, Globe, Scale, CreditCard, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface QuoteResult {
  totalCents: number
  currency: string
  breakdown: {
    baseCents: number
    arCents?: number
    pddCents?: number
  }
  productCode: string
  weightBracket: {
    min: number
    max: number
  }
  zone?: string
  notes: string[]
}

interface QuoteError {
  code: string
  message: string
  context?: Record<string, unknown>
}

export default function CalcolatoreTariffePage() {
  const [product, setProduct] = useState('')
  const [destinationType, setDestinationType] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [weightGrams, setWeightGrams] = useState('')
  const [format, setFormat] = useState('')
  const [arOption, setArOption] = useState(false)
  const [pddOption, setPddOption] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [error, setError] = useState<QuoteError | null>(null)
  const [customerPrice, setCustomerPrice] = useState<number | null>(null)

  // Configurazione prodotti e formati
  const products = [
    { value: 'POSTA1_PRO', label: 'Posta1 Pro (Italia)', formats: ['STANDARD', 'NON_STANDARD', 'PICCOLO', 'MEDIO', 'EXTRA'] },
    { value: 'POSTA4_PRO', label: 'Posta4 Pro (Italia)', formats: ['STANDARD', 'NON_STANDARD', 'PICCOLO', 'MEDIO', 'EXTRA'] },
    { value: 'INTERNATIONAL_ECO', label: 'Postamail Internazionale', formats: ['NORMALIZZATO', 'COMPATTO', 'VOLUMINOSO'] },
    { value: 'INTERNATIONAL_PRIORITY', label: 'Postapriority Internazionale', formats: ['NORMALIZZATO', 'COMPATTO', 'VOLUMINOSO'] },
    { value: 'RACCOMANDATA_PRO', label: 'Raccomandata Pro (Italia)', formats: ['STANDARD', 'NON_STANDARD'] },
    { value: 'RACCOMANDATA_INTL', label: 'Raccomandata Internazionale', formats: ['STANDARD', 'NON_STANDARD'] }
  ]

  const selectedProduct = products.find(p => p.value === product)
  const availableFormats = selectedProduct?.formats || []
  const isInternational = product === 'INTERNATIONAL_ECO' || product === 'INTERNATIONAL_PRIORITY' || product === 'RACCOMANDATA_INTL'
  const supportsPDD = product === 'RACCOMANDATA_PRO' || product === 'RACCOMANDATA_INTL'

  // Reset form quando cambia il prodotto
  useEffect(() => {
    setFormat('')
    setDestinationType(isInternational ? 'INTL' : 'ITALY')
    setCountryCode('')
    setPddOption(false)
  }, [product, isInternational])

  // Calcolo automatico quando cambiano i parametri
  useEffect(() => {
    const timer = setTimeout(() => {
      if (product && weightGrams && format && (!isInternational || countryCode)) {
        calculateQuote()
      }
    }, 300) // Debounce di 300ms

    return () => clearTimeout(timer)
  }, [product, weightGrams, format, countryCode, arOption, pddOption, isInternational])

  const calculateQuote = async () => {
    if (!product || !weightGrams || !format || (isInternational && !countryCode)) {
      setError({ code: 'INVALID_INPUT', message: 'Compila tutti i campi obbligatori' })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const requestBody = {
        product,
        destination: isInternational 
          ? { type: 'INTL', countryIso2: countryCode.toUpperCase() }
          : { type: 'ITALY' },
        weightGrams: parseInt(weightGrams),
        format,
        options: {
          ...(arOption && { AR: true }),
          ...(pddOption && { PROVA_DI_CONSEGNA: true })
        }
      }

      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        // Calcola il prezzo cliente con maggiorazione dell'80%
        const customerPriceWithMarkup = Math.round(data.totalCents * 1.8)
        setCustomerPrice(customerPriceWithMarkup)
      } else {
        setError(data)
        setCustomerPrice(null)
      }
    } catch (err) {
      setError({
        code: 'NETWORK_ERROR',
        message: 'Errore di connessione. Riprova più tardi.'
      })
      setResult(null)
      setCustomerPrice(null)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setProduct('')
    setDestinationType('')
    setCountryCode('')
    setWeightGrams('')
    setFormat('')
    setArOption(false)
    setPddOption(false)
    setResult(null)
    setError(null)
    setCustomerPrice(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            Calcolatore Tariffe Affrancaposta
          </h1>
          <p className="text-gray-600 mt-1">Calcola i costi di spedizione secondo il listino ufficiale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form di calcolo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Parametri Spedizione
            </CardTitle>
            <CardDescription>
              Inserisci i dettagli della spedizione per calcolare il costo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selezione Prodotto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prodotto *</label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il prodotto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destinazione */}
            {isInternational && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Paese di Destinazione *
                </label>
                <Input
                  placeholder="Codice ISO (es. FR, US, AU)"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">
                  Inserisci il codice ISO a 2 lettere del paese (es. FR per Francia, US per Stati Uniti)
                </p>
              </div>
            )}

            {/* Peso */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Peso (grammi) *
              </label>
              <Input
                type="number"
                placeholder="Inserisci il peso in grammi"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                min="1"
                max="2000"
              />
              <p className="text-xs text-gray-500">
                Peso massimo supportato: 2000g
              </p>
            </div>

            {/* Formato */}
            {product && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Formato *</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il formato" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFormats.map(f => (
                      <SelectItem key={f} value={f}>
                        {f.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Opzioni */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Opzioni Aggiuntive</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ar"
                  checked={arOption}
                  onCheckedChange={(checked) => setArOption(checked === true)}
                />
                <label htmlFor="ar" className="text-sm text-gray-700">
                  Avviso di Ricevimento (AR)
                </label>
              </div>

              {supportsPDD && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pdd"
                    checked={pddOption}
                    onCheckedChange={(checked) => setPddOption(checked === true)}
                  />
                  <label htmlFor="pdd" className="text-sm text-gray-700">
                    Prova di Consegna
                  </label>
                </div>
              )}
            </div>

            {/* Indicatore di caricamento e pulsante reset */}
            <div className="flex gap-3 pt-4">
              {loading && (
                <div className="flex items-center gap-2 text-blue-600 flex-1">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Calcolo in corso...
                </div>
              )}
              <Button variant="outline" onClick={resetForm} className={loading ? "" : "flex-1"}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Risultati */}
        <div className="space-y-6">
          {/* Risultato del calcolo */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Risultato Calcolo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      Costo Poste: {formatCurrency(result.totalCents / 100)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {result.currency}
                    </div>
                  </div>
                  
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-800">
                      {customerPrice ? formatCurrency(customerPrice / 100) : '€ 0.00'}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Prezzo Cliente (+80%)
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Prezzo da comunicare al cliente
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Prodotto:</span>
                    <div className="text-gray-900">{result.productCode}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Scaglione peso:</span>
                    <div className="text-gray-900">{result.weightBracket.min}g - {result.weightBracket.max}g</div>
                  </div>
                  {result.zone && (
                    <div>
                      <span className="font-medium text-gray-700">Zona:</span>
                      <div className="text-gray-900">{result.zone}</div>
                    </div>
                  )}
                </div>

                {/* Dettaglio costi */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Dettaglio Costi</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Tariffa base:</span>
                      <span>{formatCurrency(result.breakdown.baseCents / 100)}</span>
                    </div>
                    {result.breakdown.arCents && (
                      <div className="flex justify-between">
                        <span>Avviso di Ricevimento:</span>
                        <span>{formatCurrency(result.breakdown.arCents / 100)}</span>
                      </div>
                    )}
                    {result.breakdown.pddCents && (
                      <div className="flex justify-between">
                        <span>Prova di Consegna:</span>
                        <span>{formatCurrency(result.breakdown.pddCents / 100)}</span>
                      </div>
                    )}
                    <div className="border-t pt-1 flex justify-between font-medium">
                      <span>Totale:</span>
                      <span>{formatCurrency(result.totalCents / 100)}</span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {result.notes.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Note
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.notes.map((note, index) => (
                        <li key={index}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Errore */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  Errore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-red-700">
                  <div className="font-medium">{error.code}</div>
                  <div className="text-sm mt-1">{error.message}</div>
                  {error.context && (
                    <div className="text-xs mt-2 p-2 bg-red-100 rounded">
                      <pre>{JSON.stringify(error.context, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informazioni sui prodotti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Informazioni Prodotti
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <div>
                <strong>Prodotti Italia:</strong> Posta1 Pro, Posta4 Pro, Raccomandata Pro
              </div>
              <div>
                <strong>Prodotti Internazionali:</strong> Postamail, Postapriority, Raccomandata Internazionale
              </div>
              <div>
                <strong>Zone Internazionali:</strong>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• Z1: Europa, Svizzera, Vaticano</li>
                  <li>• Z2: Nord America, Australia, Giappone</li>
                  <li>• Z3: Resto del mondo</li>
                </ul>
              </div>
              <div>
                <strong>Peso massimo:</strong> 2000g per tutti i prodotti
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t">
                Tariffe aggiornate al listino &quot;Affrancaposta – Ed. Marzo 2025&quot;
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}