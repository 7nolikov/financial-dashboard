import { describe, it, expect } from 'vitest';
import { inflationFactorSinceBase, indexAmountNominal, deflateToReal } from '../../src/lib/calc/inflation';

describe('Inflation calculation', () => {
  it('should scale base-year amounts with single average yearly inflation', () => {
    const baseYear = 2025;
    const targetYear = 2026;
    const annualRate = 0.12; // 12%
    const factor = inflationFactorSinceBase({ mode: 'single', baseYear, calendarYear: targetYear, singleRate: annualRate });
    const nominal = indexAmountNominal(100, factor);
    expect(Number(nominal.toFixed(2))).toBe(112.0);

    const real = deflateToReal(nominal, factor);
    expect(Number(real.toFixed(2))).toBe(100.0);
  });
});



