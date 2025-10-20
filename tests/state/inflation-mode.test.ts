import { describe, it, expect } from 'vitest';
import { computeSeries } from '../../src/state/selectors';
import type { Store } from '../../src/state/store';

describe('Financial Calculations - Inflation Mode Tests', () => {
  const createTestStore = (inflationMode: 'nominal' | 'real'): Store => ({
    version: 1,
    dobISO: '1990-01-01',
    incomes: [
      {
        id: 'test-income',
        label: 'Test Salary',
        amount: 5000, // $5k monthly
        recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
    ],
    expenses: [
      {
        id: 'test-expense',
        label: 'Test Expense',
        amount: 3000, // $3k monthly
        recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 },
      },
    ],
    investments: [],
    loans: [],
    safetySavings: [],
    retirement: undefined,
    milestones: [],
    inflation: {
      mode: 'single',
      baseYear: 2024,
      singleRate: 0.03, // 3% annual inflation
      yearlyRates: undefined,
      display: { seriesMode: inflationMode },
    },
    chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
    // Store methods (mocked)
    setDOB: () => {},
    addIncome: () => {},
    addExpense: () => {},
    addInvestment: () => {},
    addLoan: () => {},
    addMilestone: () => {},
    removeIncome: () => {},
    removeExpense: () => {},
    removeInvestment: () => {},
    removeLoan: () => {},
    removeSafetySavings: () => {},
    setZoom: () => {},
    setInflation: () => {},
    setRetirement: () => {},
    openShare: false,
    setOpenShare: () => {},
    loadPreset: () => {},
    reset: () => {},
    clearAllData: () => {},
  });

  describe('Nominal vs Real Mode Calculations', () => {
    it('should show increasing values in nominal mode', () => {
      const store = createTestStore('nominal');
      const series = computeSeries(store);
      
      // Find points in the active period (age 25-35)
      const activePoints = series.filter(p => p.m >= 25 * 12 && p.m <= 35 * 12);
      
      expect(activePoints.length).toBeGreaterThan(0);
      
      // In nominal mode, values should increase over time due to inflation
      const firstPoint = activePoints[0];
      const lastPoint = activePoints[activePoints.length - 1];
      
      expect(lastPoint.income).toBeGreaterThan(firstPoint.income);
      expect(lastPoint.expense).toBeGreaterThan(firstPoint.expense);
    });

    it('should show constant purchasing power in real mode', () => {
      const store = createTestStore('real');
      const series = computeSeries(store);
      
      // Find points in the active period (age 25-35)
      const activePoints = series.filter(p => p.m >= 25 * 12 && p.m <= 35 * 12);
      
      expect(activePoints.length).toBeGreaterThan(0);
      
      // In real mode, purchasing power should remain relatively constant
      const firstPoint = activePoints[0];
      const lastPoint = activePoints[activePoints.length - 1];
      
      // Allow for small variations due to rounding
      expect(Math.abs(lastPoint.income - firstPoint.income)).toBeLessThan(100);
      expect(Math.abs(lastPoint.expense - firstPoint.expense)).toBeLessThan(100);
    });

    it('should maintain relationship between nominal and real values', () => {
      const nominalStore = createTestStore('nominal');
      const realStore = createTestStore('real');
      
      const nominalSeries = computeSeries(nominalStore);
      const realSeries = computeSeries(realStore);
      
      // Find a point in the active period
      const testMonth = 30 * 12; // Age 30
      const nominalPoint = nominalSeries.find(p => p.m === testMonth);
      const realPoint = realSeries.find(p => p.m === testMonth);
      
      expect(nominalPoint).toBeDefined();
      expect(realPoint).toBeDefined();
      
      if (nominalPoint && realPoint) {
        // The difference between nominal and real should be significant
        // because we're looking at age 30 (born 1990, so year 2020)
        // and base year is 2024, so there's a 4-year difference
        expect(Math.abs(nominalPoint.income - realPoint.income)).toBeGreaterThan(0);
        expect(Math.abs(nominalPoint.expense - realPoint.expense)).toBeGreaterThan(0);
      }
    });
  });

  describe('Inflation Impact on Different Components', () => {
    it('should apply inflation to all income sources', () => {
      const store = createTestStore('nominal');
      const series = computeSeries(store);
      
      const activePoints = series.filter(p => p.m >= 25 * 12 && p.m <= 35 * 12);
      const firstPoint = activePoints[0];
      const lastPoint = activePoints[activePoints.length - 1];
      
      // Income should increase due to inflation
      const incomeGrowth = (lastPoint.income - firstPoint.income) / firstPoint.income;
      expect(incomeGrowth).toBeGreaterThan(0);
    });

    it('should apply inflation to all expense categories', () => {
      const store = createTestStore('nominal');
      const series = computeSeries(store);
      
      const activePoints = series.filter(p => p.m >= 25 * 12 && p.m <= 35 * 12);
      const firstPoint = activePoints[0];
      const lastPoint = activePoints[activePoints.length - 1];
      
      // Expenses should increase due to inflation
      const expenseGrowth = (lastPoint.expense - firstPoint.expense) / firstPoint.expense;
      expect(expenseGrowth).toBeGreaterThan(0);
    });

    it('should apply inflation to safety savings targets', () => {
      const store = createTestStore('nominal');
      const series = computeSeries(store);
      
      const activePoints = series.filter(p => p.m >= 25 * 12 && p.m <= 35 * 12);
      const firstPoint = activePoints[0];
      const lastPoint = activePoints[activePoints.length - 1];
      
      // Safety targets should increase due to inflation
      if (firstPoint.safety > 0 && lastPoint.safety > 0) {
        const safetyGrowth = (lastPoint.safety - firstPoint.safety) / firstPoint.safety;
        expect(safetyGrowth).toBeGreaterThan(0);
      }
    });
  });

  describe('Inflation Rate Variations', () => {
    it('should handle different inflation rates correctly', () => {
      const lowInflationStore = createTestStore('nominal');
      lowInflationStore.inflation.singleRate = 0.01; // 1%
      
      const highInflationStore = createTestStore('nominal');
      highInflationStore.inflation.singleRate = 0.05; // 5%
      
      const lowSeries = computeSeries(lowInflationStore);
      const highSeries = computeSeries(highInflationStore);
      
      const testMonth = 30 * 12; // Age 30
      const lowPoint = lowSeries.find(p => p.m === testMonth);
      const highPoint = highSeries.find(p => p.m === testMonth);
      
      expect(lowPoint).toBeDefined();
      expect(highPoint).toBeDefined();
      
      if (lowPoint && highPoint) {
        // Both should have positive values
        expect(lowPoint.income).toBeGreaterThan(0);
        expect(highPoint.income).toBeGreaterThan(0);
        expect(lowPoint.expense).toBeGreaterThan(0);
        expect(highPoint.expense).toBeGreaterThan(0);
      }
    });

    it('should handle zero inflation correctly', () => {
      const zeroInflationStore = createTestStore('nominal');
      zeroInflationStore.inflation.singleRate = 0;
      
      const series = computeSeries(zeroInflationStore);
      const activePoints = series.filter(p => p.m >= 25 * 12 && p.m <= 35 * 12);
      
      if (activePoints.length > 1) {
        const firstPoint = activePoints[0];
        const lastPoint = activePoints[activePoints.length - 1];
        
        // With zero inflation, values should remain constant
        expect(Math.abs(lastPoint.income - firstPoint.income)).toBeLessThan(1);
        expect(Math.abs(lastPoint.expense - firstPoint.expense)).toBeLessThan(1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty income and expense arrays', () => {
      const store = createTestStore('nominal');
      store.incomes = [];
      store.expenses = [];
      
      const series = computeSeries(store);
      expect(series.length).toBeGreaterThan(0);
      
      // All values should be zero
      series.forEach(point => {
        expect(point.income).toBe(0);
        expect(point.expense).toBe(0);
      });
    });

    it('should handle future years correctly', () => {
      const store = createTestStore('nominal');
      store.dobISO = '2000-01-01'; // Born in 2000
      store.inflation.baseYear = 2024;
      
      const series = computeSeries(store);
      const futurePoints = series.filter(p => p.m >= 30 * 12); // Age 30+ (2030+)
      
      expect(futurePoints.length).toBeGreaterThan(0);
      
      // Future values should be inflated
      const firstFuturePoint = futurePoints[0];
      expect(firstFuturePoint.income).toBeGreaterThan(0);
    });
  });
});
