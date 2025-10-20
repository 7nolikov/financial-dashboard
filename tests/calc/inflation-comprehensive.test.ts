import { describe, it, expect } from 'vitest';
import { inflationFactorSinceBase, indexAmountNominal, deflateToReal } from '../../src/lib/calc/inflation';

describe('Inflation Calculations - Comprehensive Tests', () => {
  describe('inflationFactorSinceBase', () => {
    it('should calculate inflation factor for single rate mode', () => {
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2025,
        singleRate: 0.03,
      });
      expect(factor).toBeCloseTo(1.03, 5);
    });

    it('should calculate inflation factor for multiple years', () => {
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2027,
        singleRate: 0.03,
      });
      expect(factor).toBeCloseTo(1.092727, 5); // (1.03)^3
    });

    it('should calculate deflation factor for past years', () => {
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2023,
        singleRate: 0.03,
      });
      expect(factor).toBeCloseTo(0.970874, 5); // 1/(1.03)
    });

    it('should calculate inflation factor for yearly table mode', () => {
      const factor = inflationFactorSinceBase({
        mode: 'yearlyTable',
        baseYear: 2024,
        calendarYear: 2026,
        yearlyRates: {
          2024: 0.02,
          2025: 0.03,
          2026: 0.025,
        },
      });
      expect(factor).toBeCloseTo(1.0506, 5); // 1.02 * 1.03
    });

    it('should handle zero inflation rate', () => {
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2025,
        singleRate: 0,
      });
      expect(factor).toBe(1);
    });
  });

  describe('indexAmountNominal', () => {
    it('should apply inflation factor to base amount', () => {
      const result = indexAmountNominal(1000, 1.03);
      expect(result).toBe(1030);
    });

    it('should handle deflation', () => {
      const result = indexAmountNominal(1000, 0.97);
      expect(result).toBe(970);
    });

    it('should handle zero factor', () => {
      const result = indexAmountNominal(1000, 0);
      expect(result).toBe(0);
    });
  });

  describe('deflateToReal', () => {
    it('should convert nominal amount to real amount', () => {
      const result = deflateToReal(1030, 1.03);
      expect(result).toBeCloseTo(1000, 5);
    });

    it('should handle deflation', () => {
      const result = deflateToReal(970, 0.97);
      expect(result).toBeCloseTo(1000, 5);
    });

    it('should handle zero factor', () => {
      const result = deflateToReal(1000, 0);
      expect(result).toBe(1000);
    });
  });

  describe('Real-world scenarios', () => {
    it('should correctly calculate 30-year inflation impact', () => {
      const baseAmount = 50000; // $50k salary in 2024
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2054,
        singleRate: 0.03,
      });
      
      const nominalAmount = indexAmountNominal(baseAmount, factor);
      const realAmount = deflateToReal(nominalAmount, factor);
      
      expect(nominalAmount).toBeCloseTo(121363.12, 2); // $50k * (1.03)^30
      expect(realAmount).toBeCloseTo(baseAmount, 2); // Should equal original
    });

    it('should correctly calculate variable inflation over 10 years', () => {
      const baseAmount = 100000;
      const yearlyRates = {
        2024: 0.02,
        2025: 0.025,
        2026: 0.03,
        2027: 0.035,
        2028: 0.03,
        2029: 0.025,
        2030: 0.02,
        2031: 0.015,
        2032: 0.01,
        2033: 0.005,
      };
      
      const factor = inflationFactorSinceBase({
        mode: 'yearlyTable',
        baseYear: 2024,
        calendarYear: 2034,
        yearlyRates,
      });
      
      const nominalAmount = indexAmountNominal(baseAmount, factor);
      const realAmount = deflateToReal(nominalAmount, factor);
      
      expect(nominalAmount).toBeGreaterThan(baseAmount);
      expect(realAmount).toBeCloseTo(baseAmount, 2);
    });

    it('should maintain purchasing power in real mode', () => {
      const baseAmount = 3000; // Monthly expenses
      const years = 20;
      
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2024 + years,
        singleRate: 0.03,
      });
      
      const nominalAmount = indexAmountNominal(baseAmount, factor);
      const realAmount = deflateToReal(nominalAmount, factor);
      
      // In real terms, purchasing power should be maintained
      expect(realAmount).toBeCloseTo(baseAmount, 2);
      
      // In nominal terms, amount should increase
      expect(nominalAmount).toBeGreaterThan(baseAmount);
    });
  });

  describe('Edge cases', () => {
    it('should handle same base and calendar year', () => {
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2024,
        singleRate: 0.03,
      });
      expect(factor).toBe(1);
    });

    it('should handle missing yearly rates', () => {
      const factor = inflationFactorSinceBase({
        mode: 'yearlyTable',
        baseYear: 2024,
        calendarYear: 2026,
        yearlyRates: {},
      });
      expect(factor).toBe(1);
    });

    it('should handle negative inflation (deflation)', () => {
      const factor = inflationFactorSinceBase({
        mode: 'single',
        baseYear: 2024,
        calendarYear: 2025,
        singleRate: -0.01,
      });
      expect(factor).toBeCloseTo(0.99, 5);
    });
  });
});
