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

  it('should handle deflation when calendar year is before base year', () => {
    const factor = inflationFactorSinceBase({
      mode: 'single',
      baseYear: 2024,
      calendarYear: 2020,
      singleRate: 0.03
    });
    // Should be less than 1 (deflation)
    expect(factor).toBeLessThan(1);
    expect(factor).toBeCloseTo(Math.pow(1.03, -4)); // 4 years back
  });

  it('should handle inflation when calendar year is after base year', () => {
    const factor = inflationFactorSinceBase({
      mode: 'single',
      baseYear: 2020,
      calendarYear: 2024,
      singleRate: 0.03
    });
    // Should be greater than 1 (inflation)
    expect(factor).toBeGreaterThan(1);
    expect(factor).toBeCloseTo(Math.pow(1.03, 4)); // 4 years forward
  });

  it('should return 1 when calendar year equals base year', () => {
    const factor = inflationFactorSinceBase({
      mode: 'single',
      baseYear: 2024,
      calendarYear: 2024,
      singleRate: 0.03
    });
    expect(factor).toBe(1);
  });
});



