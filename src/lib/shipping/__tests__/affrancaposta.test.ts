import { quote, isFormatAllowed, resolveZone, findWeightBracket, QuoteError } from '../affrancaposta';
import type { QuoteInput } from '../affrancaposta';

// Simple test runner
function runTests() {
  console.log('🧪 Running Affrancaposta Shipping Engine Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name: string, testFn: () => void) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }
  
  function expect(actual: unknown) {
    return {
      toBe: (expected: unknown) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toEqual: (expected: unknown) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toContain: (expected: unknown) => {
        if (Array.isArray(actual) && !actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`);
        }
      },
      toThrow: (expectedError?: string | typeof QuoteError) => {
        if (typeof actual !== 'function') {
          throw new Error('Expected a function that throws');
        }
        try {
          (actual as Function)();
          throw new Error('Expected function to throw, but it did not');
        } catch (error) {
          if (expectedError === QuoteError && !(error instanceof QuoteError)) {
            throw new Error(`Expected QuoteError, got ${error}`);
          }
          if (typeof expectedError === 'string' && !String(error).includes(expectedError)) {
            throw new Error(`Expected error to contain "${expectedError}", got "${error}"`);
          }
        }
      }
    };
  }
  
  // Test isFormatAllowed
  console.log('📋 Testing isFormatAllowed...');
  test('should allow correct formats for POSTA1_PRO', () => {
    expect(isFormatAllowed('POSTA1_PRO', 'STANDARD')).toBe(true);
    expect(isFormatAllowed('POSTA1_PRO', 'NON_STANDARD')).toBe(true);
    expect(isFormatAllowed('POSTA1_PRO', 'PICCOLO')).toBe(true);
  });
  
  test('should allow correct formats for INTERNATIONAL_ECO', () => {
    expect(isFormatAllowed('INTERNATIONAL_ECO', 'NORMALIZZATO')).toBe(true);
    expect(isFormatAllowed('INTERNATIONAL_ECO', 'COMPATTO')).toBe(true);
    expect(isFormatAllowed('INTERNATIONAL_ECO', 'VOLUMINOSO')).toBe(true);
  });
  
  test('should reject incorrect formats', () => {
    expect(isFormatAllowed('POSTA1_PRO', 'NORMALIZZATO')).toBe(false);
    expect(isFormatAllowed('INTERNATIONAL_ECO', 'PICCOLO')).toBe(false);
  });
  
  // Test resolveZone
  console.log('\n🌍 Testing resolveZone...');
  test('should resolve zones correctly', () => {
    expect(resolveZone('FR')).toBe('Z1');
    expect(resolveZone('US')).toBe('Z2');
    expect(resolveZone('AU')).toBe('Z3');
  });
  
  test('should handle case insensitive country codes', () => {
    expect(resolveZone('fr')).toBe('Z1');
    expect(resolveZone('us')).toBe('Z2');
  });
  
  test('should throw error for unknown countries', () => {
    expect(() => resolveZone('XX')).toThrow(QuoteError);
  });
  
  // Test findWeightBracket
  console.log('\n⚖️ Testing findWeightBracket...');
  const brackets = [20, 50, 100, 250, 350, 1000, 2000];
  
  test('should find correct weight brackets', () => {
    expect(findWeightBracket(15, brackets)).toEqual({ min: 1, max: 20 });
    expect(findWeightBracket(20, brackets)).toEqual({ min: 1, max: 20 });
    expect(findWeightBracket(21, brackets)).toEqual({ min: 21, max: 50 });
    expect(findWeightBracket(100, brackets)).toEqual({ min: 51, max: 100 });
  });
  
  test('should throw error for weight exceeding maximum', () => {
    expect(() => findWeightBracket(2001, brackets)).toThrow(QuoteError);
  });
  
  // Test quote function - Basic cases
  console.log('\n💰 Testing quote function...');
  
  test('should calculate Posta1 Pro Standard 20g Italy', () => {
    const input: QuoteInput = {
      product: 'POSTA1_PRO',
      destination: { type: 'ITALY' },
      weightGrams: 20,
      format: 'STANDARD'
    };
    
    const result = quote(input);
    expect(result.currency).toBe('EUR');
    expect(result.productCode).toBe('POSTA1_PRO/STANDARD');
    expect(result.weightBracket).toEqual({ min: 1, max: 20 });
  });
  
  test('should calculate Posta4 Pro Non Standard 100g', () => {
    const input: QuoteInput = {
      product: 'POSTA4_PRO',
      destination: { type: 'ITALY' },
      weightGrams: 100,
      format: 'NON_STANDARD'
    };
    
    const result = quote(input);
    expect(result.currency).toBe('EUR');
    expect(result.productCode).toBe('POSTA4_PRO/NON_STANDARD');
  });
  
  test('should calculate Priority International Z1 Compatto 100g', () => {
    const input: QuoteInput = {
      product: 'INTERNATIONAL_PRIORITY',
      destination: { type: 'INTL', countryIso2: 'FR' },
      weightGrams: 100,
      format: 'COMPATTO'
    };
    
    const result = quote(input);
    expect(result.currency).toBe('EUR');
    expect(result.productCode).toBe('INTERNATIONAL_PRIORITY/Z1/COMPATTO');
    expect(result.zone).toBe('Z1');
  });
  
  test('should calculate Raccomandata Pro Italy Standard 350g', () => {
    const input: QuoteInput = {
      product: 'RACCOMANDATA_PRO',
      destination: { type: 'ITALY' },
      weightGrams: 350,
      format: 'STANDARD'
    };
    
    const result = quote(input);
    expect(result.currency).toBe('EUR');
    expect(result.productCode).toBe('RACCOMANDATA_PRO/STANDARD');
  });
  
  test('should calculate Raccomandata International Z2 Standard 20g', () => {
    const input: QuoteInput = {
      product: 'RACCOMANDATA_INTL',
      destination: { type: 'INTL', countryIso2: 'US' },
      weightGrams: 20,
      format: 'STANDARD'
    };
    
    const result = quote(input);
    expect(result.currency).toBe('EUR');
    expect(result.productCode).toBe('RACCOMANDATA_INTL/Z2/STANDARD');
    expect(result.zone).toBe('Z2');
  });
  
  // Test error cases
  console.log('\n🚨 Testing error cases...');
  
  test('should throw error for invalid weight', () => {
    const input: QuoteInput = {
      product: 'POSTA1_PRO',
      destination: { type: 'ITALY' },
      weightGrams: 0,
      format: 'STANDARD'
    };
    
    expect(() => quote(input)).toThrow(QuoteError);
  });
  
  test('should throw error for invalid format', () => {
    const input: QuoteInput = {
      product: 'POSTA1_PRO',
      destination: { type: 'ITALY' },
      weightGrams: 20,
      format: 'NORMALIZZATO' as any
    };
    
    expect(() => quote(input)).toThrow(QuoteError);
  });
  
  test('should throw error for weight out of range', () => {
    const input: QuoteInput = {
      product: 'POSTA1_PRO',
      destination: { type: 'ITALY' },
      weightGrams: 3000,
      format: 'STANDARD'
    };
    
    expect(() => quote(input)).toThrow(QuoteError);
  });
  
  test('should throw error for unknown zone', () => {
    const input: QuoteInput = {
      product: 'INTERNATIONAL_ECO',
      destination: { type: 'INTL', countryIso2: 'XX' },
      weightGrams: 20,
      format: 'NORMALIZZATO'
    };
    
    expect(() => quote(input)).toThrow(QuoteError);
  });
  
  // Summary
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('❌ Some tests failed. Please check the implementation.');
  }
  
  return { passed, failed };
}

// Export for use in other files
export { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}