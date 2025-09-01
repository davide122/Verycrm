import fs from 'fs';
import path from 'path';

// Types
export type QuoteInput = {
  product: 'POSTA4_PRO' | 'POSTA1_PRO' | 'INTERNATIONAL_ECO' | 'INTERNATIONAL_PRIORITY' | 'RACCOMANDATA_PRO' | 'RACCOMANDATA_INTL';
  destination: { type: 'ITALY' } | { type: 'INTL', countryIso2: string };
  weightGrams: number;
  format: 'NORMALIZZATO' | 'COMPATTO' | 'VOLUMINOSO' | 'STANDARD' | 'NON_STANDARD' | 'PICCOLO' | 'MEDIO' | 'EXTRA';
  homologation?: 'OM' | 'NO';
  options?: {
    AR?: boolean;
    PROVA_DI_CONSEGNA?: boolean;
  };
};

export type QuoteOutput = {
  totalCents: number;
  currency: 'EUR';
  breakdown: {
    baseCents: number;
    arCents?: number;
    pddCents?: number;
  };
  productCode: string;
  weightBracket: { min: number; max: number };
  zone?: 'Z1' | 'Z2' | 'Z3';
  notes?: string[];
};

export type QuoteErrorCode =
  | 'INVALID_INPUT'
  | 'FORMAT_NOT_ALLOWED'
  | 'WEIGHT_OUT_OF_RANGE'
  | 'ZONE_NOT_FOUND'
  | 'OPTION_NOT_SUPPORTED'
  | 'TARIFF_NOT_FOUND';

export class QuoteError extends Error {
  constructor(
    public code: QuoteErrorCode,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'QuoteError';
  }
}

// Data loading functions
function loadTariffData(filename: string): Record<string, unknown> {
  const filePath = path.join(process.cwd(), 'data', 'affrancaposta', filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new QuoteError('TARIFF_NOT_FOUND', `Cannot load tariff data from ${filename}`, { filename, error });
  }
}

function loadZoneMapping(): Record<string, string> {
  const filePath = path.join(process.cwd(), 'zones', 'country-to-zone.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new QuoteError('ZONE_NOT_FOUND', 'Cannot load zone mapping data', { error });
  }
}

function loadOptionsConfig(): Record<string, { cents?: number | null; supportedProducts?: string[] }> {
  const filePath = path.join(process.cwd(), 'pricing', 'options.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new QuoteError('TARIFF_NOT_FOUND', 'Cannot load options configuration', { error });
  }
}

// Validation functions
export function isFormatAllowed(product: string, format: string): boolean {
  const formatMap: Record<string, string[]> = {
    'POSTA4_PRO': ['STANDARD', 'NON_STANDARD', 'PICCOLO', 'MEDIO', 'EXTRA'],
    'POSTA1_PRO': ['STANDARD', 'NON_STANDARD', 'PICCOLO', 'MEDIO', 'EXTRA'],
    'INTERNATIONAL_ECO': ['NORMALIZZATO', 'COMPATTO', 'VOLUMINOSO'],
    'INTERNATIONAL_PRIORITY': ['NORMALIZZATO', 'COMPATTO', 'VOLUMINOSO'],
    'RACCOMANDATA_PRO': ['STANDARD', 'NON_STANDARD'],
    'RACCOMANDATA_INTL': ['STANDARD', 'NON_STANDARD']
  };

  return formatMap[product]?.includes(format) || false;
}

export function resolveZone(countryIso2: string): 'Z1' | 'Z2' | 'Z3' {
  const zoneMapping = loadZoneMapping();
  const zone = zoneMapping[countryIso2.toUpperCase()];
  
  if (!zone) {
    throw new QuoteError('ZONE_NOT_FOUND', `Country ${countryIso2} not found in zone mapping`, { countryIso2 });
  }
  
  return zone as 'Z1' | 'Z2' | 'Z3';
}

export function findWeightBracket(weightGrams: number, brackets: number[]): { min: number; max: number } {
  const sortedBrackets = brackets.sort((a, b) => a - b);
  
  for (let i = 0; i < sortedBrackets.length; i++) {
    if (weightGrams <= sortedBrackets[i]) {
      const min = i === 0 ? 1 : sortedBrackets[i - 1] + 1;
      const max = sortedBrackets[i];
      return { min, max };
    }
  }
  
  throw new QuoteError('WEIGHT_OUT_OF_RANGE', `Weight ${weightGrams}g exceeds maximum allowed weight`, {
    weightGrams,
    maxWeight: Math.max(...sortedBrackets)
  });
}

function validateInput(input: QuoteInput): void {
  if (input.weightGrams <= 0) {
    throw new QuoteError('INVALID_INPUT', 'Weight must be greater than 0', { weightGrams: input.weightGrams });
  }
  
  if (!isFormatAllowed(input.product, input.format)) {
    throw new QuoteError('FORMAT_NOT_ALLOWED', `Format ${input.format} not allowed for product ${input.product}`, {
      product: input.product,
      format: input.format
    });
  }
}

function getTariffFilename(product: string): string {
  const filenameMap: Record<string, string> = {
    'POSTA4_PRO': 'posta4_pro.it.json',
    'POSTA1_PRO': 'posta1_pro.it.json',
    'INTERNATIONAL_ECO': 'postamail_intl.json',
    'INTERNATIONAL_PRIORITY': 'postapriority_intl.json',
    'RACCOMANDATA_PRO': 'raccomandata_pro.it.json',
    'RACCOMANDATA_INTL': 'raccomandata_intl.json'
  };
  
  return filenameMap[product];
}

function getProductCode(input: QuoteInput, zone?: string): string {
  const { product, format } = input;
  
  if (zone) {
    return `${product}/${zone}/${format}`;
  }
  
  return `${product}/${format}`;
}

function extractBaseCents(tariffData: Record<string, unknown>, input: QuoteInput, zone?: string): number {
  const { format, weightGrams } = input;
  const weightBrackets = [20, 50, 100, 250, 350, 500, 1000, 2000];
  const bracket = findWeightBracket(weightGrams, weightBrackets);
  const weightKey = bracket.max.toString();
  
  let tariffSection: unknown = tariffData;
  
  // Navigate to the correct section based on product type
  if (zone) {
    // Map Z1, Z2, Z3 to zone1, zone2, zone3
    const zoneKey = zone.toLowerCase().replace('z', 'zone');
    tariffSection = (tariffSection as Record<string, unknown>)[zoneKey];
  }
  
  // Handle different format structures
  const formatKey = format.toLowerCase();
  
  if (input.product === 'POSTA4_PRO' || input.product === 'POSTA1_PRO') {
    // These products have standard/non_standard -> piccolo/medio/extra structure
    const standardKey = format === 'STANDARD' ? 'standard' : 'non_standard';
    if (format === 'PICCOLO' || format === 'MEDIO' || format === 'EXTRA') {
      const standardSection = (tariffSection as Record<string, unknown>).standard as Record<string, unknown>;
      tariffSection = standardSection[formatKey];
    } else {
      // Default to piccolo for standard/non_standard without sub-format
      const keySection = (tariffSection as Record<string, unknown>)[standardKey] as Record<string, unknown>;
      tariffSection = keySection.piccolo;
    }
  } else if (input.product === 'RACCOMANDATA_PRO') {
    // Raccomandata Pro has direct standard/non_standard structure
    const standardKey = format === 'STANDARD' ? 'standard' : 'non_standard';
    tariffSection = (tariffSection as Record<string, unknown>)[standardKey];
  } else {
    // International products and Raccomandata INTL
    if (input.product === 'RACCOMANDATA_INTL') {
      const standardKey = format === 'STANDARD' ? 'standard' : 'non_standard';
      tariffSection = (tariffSection as Record<string, unknown>)[standardKey];
    } else {
      // International ECO/PRIORITY
      tariffSection = (tariffSection as Record<string, unknown>)[formatKey];
    }
  }
  
  const baseCents = (tariffSection as Record<string, unknown>)[weightKey];
  
  if (typeof baseCents !== 'number') {
    throw new QuoteError('TARIFF_NOT_FOUND', 'Tariff not found for the specified parameters', {
      product: input.product,
      format: input.format,
      weightGrams: input.weightGrams,
      zone
    });
  }
  
  return baseCents;
}

// Main quote function
export function quote(input: QuoteInput): QuoteOutput {
  // Validate input
  validateInput(input);
  
  // Determine zone for international products
  let zone: 'Z1' | 'Z2' | 'Z3' | undefined;
  if (input.destination.type === 'INTL') {
    zone = resolveZone(input.destination.countryIso2);
  }
  
  // Load tariff data
  const tariffFilename = getTariffFilename(input.product);
  const tariffData = loadTariffData(tariffFilename);
  
  // Extract base price
  const baseCents = extractBaseCents(tariffData, input, zone);
  
  // Calculate weight bracket
  const weightBrackets = [20, 50, 100, 250, 350, 500, 1000, 2000];
  const weightBracket = findWeightBracket(input.weightGrams, weightBrackets);
  
  // Handle options
  const breakdown: QuoteOutput['breakdown'] = { baseCents };
  let totalCents = baseCents;
  
  if (input.options) {
    const optionsConfig = loadOptionsConfig();
    
    if (input.options.AR) {
      const arCents = optionsConfig.AR?.cents;
      if (arCents !== null && arCents !== undefined) {
        breakdown.arCents = arCents;
        totalCents += arCents;
      }
    }
    
    if (input.options.PROVA_DI_CONSEGNA) {
      const pddConfig = optionsConfig.PROVA_DI_CONSEGNA;
      if (!pddConfig?.supportedProducts?.includes(input.product)) {
        throw new QuoteError('OPTION_NOT_SUPPORTED', `Prova di Consegna not supported for product ${input.product}`, {
          product: input.product
        });
      }
      
      const pddCents = pddConfig?.cents;
      if (pddCents !== null && pddCents !== undefined) {
        breakdown.pddCents = pddCents;
        totalCents += pddCents;
      }
    }
  }
  
  // Build response
  const result: QuoteOutput = {
    totalCents,
    currency: 'EUR',
    breakdown,
    productCode: getProductCode(input, zone),
    weightBracket,
    notes: [tariffData.ivaNote as string]
  };
  
  if (zone) {
    result.zone = zone;
  }
  
  return result;
}

// Export default
export default {
  quote,
  isFormatAllowed,
  resolveZone,
  findWeightBracket,
  QuoteError
};