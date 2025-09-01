# Motore Tariffario Affrancaposta

Motore tariffario lato server per il calcolo dei costi di spedizione secondo il listino "Affrancaposta – Ed. Marzo 2025".

## Prodotti Supportati

- **Posta4 Pro** (Italia) — Standard/Non Standard; sotto-formati Piccolo/Medio/Extra
- **Posta1 Pro** (Italia) — Standard/Non Standard; sotto-formati come da listino
- **Postamail Internazionale** (International/Economy) — Zone 1/2/3; Formati: Normalizzato/Compatto/Voluminoso
- **Postapriority Internazionale** (International/Priority) — Zone 1/2/3; Formati: Normalizzato/Compatto/Voluminoso
- **Raccomandata Pro** (Italia) — Standard/Non Standard
- **Raccomandata Internazionale** — Standard e Non Standard per Zone 1/2/3

## Struttura del Progetto

```
data/
├── affrancaposta/           # Dati tariffari
│   ├── posta4_pro.it.json
│   ├── posta1_pro.it.json
│   ├── postamail_intl.json
│   ├── postapriority_intl.json
│   ├── raccomandata_pro.it.json
│   └── raccomandata_intl.json
├── zones/
│   └── country-to-zone.json # Mappatura paese → zona
└── pricing/
    └── options.json         # Configurazione sovrapprezzi

src/lib/shipping/
├── affrancaposta.ts         # Modulo principale
└── __tests__/
    └── affrancaposta.test.ts # Test suite

src/app/api/shipping/quote/
└── route.ts                 # Endpoint API
```

## Utilizzo del Modulo

### Import

```typescript
import { quote, QuoteInput, QuoteOutput } from '@/lib/shipping/affrancaposta';
```

### Esempi di Utilizzo

#### Posta1 Pro Italia

```typescript
const input: QuoteInput = {
  product: 'POSTA1_PRO',
  destination: { type: 'ITALY' },
  weightGrams: 20,
  format: 'STANDARD'
};

const result = quote(input);
console.log(result);
// {
//   totalCents: 110,
//   currency: 'EUR',
//   breakdown: { baseCents: 110 },
//   productCode: 'POSTA1_PRO/STANDARD',
//   weightBracket: { min: 1, max: 20 },
//   notes: ['IVA inclusa ove applicabile']
// }
```

#### Spedizione Internazionale

```typescript
const input: QuoteInput = {
  product: 'INTERNATIONAL_PRIORITY',
  destination: { type: 'INTL', countryIso2: 'FR' },
  weightGrams: 100,
  format: 'COMPATTO'
};

const result = quote(input);
console.log(result);
// {
//   totalCents: 420,
//   currency: 'EUR',
//   breakdown: { baseCents: 420 },
//   productCode: 'INTERNATIONAL_PRIORITY/Z1/COMPATTO',
//   weightBracket: { min: 51, max: 100 },
//   zone: 'Z1',
//   notes: ['IVA inclusa ove applicabile']
// }
```

#### Con Opzioni (AR)

```typescript
const input: QuoteInput = {
  product: 'POSTA1_PRO',
  destination: { type: 'ITALY' },
  weightGrams: 20,
  format: 'STANDARD',
  options: { AR: true }
};

const result = quote(input);
// totalCents includerà il sovrapprezzo AR configurato
```

## API Endpoint

### POST /api/shipping/quote

```bash
curl -X POST http://localhost:3001/api/shipping/quote \
  -H "Content-Type: application/json" \
  -d '{
    "product": "POSTA1_PRO",
    "destination": { "type": "ITALY" },
    "weightGrams": 20,
    "format": "STANDARD"
  }'
```

### Risposta di Successo (200)

```json
{
  "totalCents": 110,
  "currency": "EUR",
  "breakdown": {
    "baseCents": 110
  },
  "productCode": "POSTA1_PRO/STANDARD",
  "weightBracket": {
    "min": 1,
    "max": 20
  },
  "notes": ["IVA inclusa ove applicabile"]
}
```

### Risposta di Errore (400/404/500)

```json
{
  "code": "FORMAT_NOT_ALLOWED",
  "message": "Format NORMALIZZATO not allowed for product POSTA1_PRO",
  "context": {
    "product": "POSTA1_PRO",
    "format": "NORMALIZZATO",
    "allowedFormats": ["STANDARD", "NON_STANDARD", "PICCOLO", "MEDIO", "EXTRA"]
  }
}
```

## Codici di Errore

- `INVALID_INPUT` - Input non valido (peso ≤ 0)
- `FORMAT_NOT_ALLOWED` - Formato non compatibile con il prodotto
- `WEIGHT_OUT_OF_RANGE` - Peso superiore al massimale del prodotto
- `ZONE_NOT_FOUND` - Paese non mappato a una zona
- `OPTION_NOT_SUPPORTED` - Opzione non supportata per il prodotto
- `TARIFF_NOT_FOUND` - Tariffa non trovata per i parametri specificati

## Test

### Esecuzione Test

```bash
# Test completo del motore
npx tsx test-shipping.ts

# Test con Jest (se configurato)
npm test src/lib/shipping/__tests__/affrancaposta.test.ts
```

### Casi di Test Implementati

- ✅ Validazione formati per ogni prodotto
- ✅ Risoluzione zone internazionali
- ✅ Calcolo scaglioni peso
- ✅ Calcoli tariffari base per tutti i prodotti
- ✅ Gestione sovrapprezzi opzionali
- ✅ Gestione errori per tutti i casi edge

## Configurazione

### Aggiornamento Tariffe

Per aggiornare le tariffe, modificare i file JSON in `data/affrancaposta/`:

```json
{
  "ivaNote": "IVA inclusa ove applicabile",
  "standard": {
    "piccolo": {
      "20": 110,
      "50": 130,
      "100": 150
    }
  }
}
```

### Aggiornamento Zone

Per aggiungere nuovi paesi, modificare `data/zones/country-to-zone.json`:

```json
{
  "FR": "Z1",
  "ES": "Z1",
  "US": "Z2",
  "AU": "Z3"
}
```

### Configurazione Sovrapprezzi

Per configurare i sovrapprezzi, modificare `data/pricing/options.json`:

```json
{
  "AR": {
    "cents": 200,
    "description": "Avviso di Ricevimento"
  },
  "PROVA_DI_CONSEGNA": {
    "cents": 300,
    "description": "Prova di Consegna",
    "supportedProducts": ["RACCOMANDATA_PRO", "RACCOMANDATA_INTL"]
  }
}
```

## Note Implementative

- Tutti i prezzi sono gestiti in **centesimi** per evitare problemi di arrotondamento
- I valori del listino sono "IVA inclusa ove applicabile" come da specifica
- La mappatura paese→zona deve essere configurata manualmente
- I sovrapprezzi sono opzionali e configurabili
- Il sistema supporta validazioni complete per formato, peso e compatibilità prodotto