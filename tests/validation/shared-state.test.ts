import { describe, it, expect } from 'vitest';
import { sanitizeSharedState } from '../../src/lib/validation/shared-state';
import { computeSeries, type ComputationInput } from '../../src/state/selectors';
import { inflationFactorSinceBase } from '../../src/lib/calc/inflation';

describe('sanitizeSharedState (untrusted share-link input)', () => {
  it('rejects non-object input', () => {
    expect(sanitizeSharedState(null)).toBeNull();
    expect(sanitizeSharedState('boom')).toBeNull();
    expect(sanitizeSharedState(42)).toBeNull();
  });

  it('drops non-array collections instead of passing them through', () => {
    const out = sanitizeSharedState({ incomes: 'not-an-array', expenses: {} });
    // Invalid arrays are omitted, so the caller keeps its trusted defaults.
    expect(out).not.toBeNull();
    expect(out!.incomes).toBeUndefined();
    expect(out!.expenses).toBeUndefined();
  });

  it('drops malformed entries but keeps valid ones', () => {
    const out = sanitizeSharedState({
      incomes: [
        {
          id: 'a',
          label: 'Salary',
          amount: 1000,
          recurrence: {
            kind: 'recurring',
            start: { ageYears: 22, monthIndex: 264 },
            everyMonths: 1,
          },
        },
        { id: 'b', label: 'Broken', amount: 500 }, // no recurrence -> dropped
        'garbage',
      ],
    });
    expect(out!.incomes).toHaveLength(1);
    expect(out!.incomes![0]!.id).toBe('a');
  });

  it('clamps everyMonths to a positive integer (0 would break the modulo math)', () => {
    const out = sanitizeSharedState({
      expenses: [
        {
          id: 'x',
          label: 'Rent',
          amount: 100,
          recurrence: { kind: 'recurring', start: { ageYears: 0, monthIndex: 0 }, everyMonths: 0 },
        },
      ],
    });
    const rec = out!.expenses![0]!.recurrence;
    expect(rec.kind).toBe('recurring');
    if (rec.kind === 'recurring') expect(rec.everyMonths).toBeGreaterThanOrEqual(1);
  });

  it('clamps a hostile inflation.baseYear into range', () => {
    const out = sanitizeSharedState({
      inflation: {
        mode: 'yearlyTable',
        baseYear: -1_000_000_000,
        display: { seriesMode: 'nominal' },
      },
    });
    expect(out!.inflation!.baseYear).toBeGreaterThanOrEqual(1900);
    expect(out!.inflation!.baseYear).toBeLessThanOrEqual(2200);
  });

  it('rejects non-finite amounts (NaN/Infinity) and falls back to 0', () => {
    const out = sanitizeSharedState({
      incomes: [
        {
          id: 'n',
          label: 'NaN',
          amount: Number.POSITIVE_INFINITY,
          recurrence: { kind: 'one_time', at: { ageYears: 30, monthIndex: 360 } },
        },
      ],
    });
    expect(Number.isFinite(out!.incomes![0]!.amount)).toBe(true);
  });

  it('rejects an invalid dobISO so the default is kept', () => {
    expect(sanitizeSharedState({ dobISO: 'not-a-date' })!.dobISO).toBeUndefined();
    expect(sanitizeSharedState({ dobISO: '1990-01-01' })!.dobISO).toBe('1990-01-01');
  });

  it('produces state that computeSeries handles without throwing or hanging', () => {
    const sanitized = sanitizeSharedState({
      dobISO: '1990-01-01',
      incomes: [
        {
          id: 'a',
          label: 'x',
          amount: 1e30,
          recurrence: { kind: 'recurring', start: { ageYears: 0, monthIndex: 0 }, everyMonths: 0 },
        },
      ],
      inflation: { mode: 'yearlyTable', baseYear: -1e9, display: { seriesMode: 'real' } },
    })!;
    const input: ComputationInput = {
      dobISO: sanitized.dobISO ?? '1990-01-01',
      incomes: sanitized.incomes ?? [],
      expenses: [],
      investments: [],
      loans: [],
      safetySavings: [],
      retirement: undefined,
      inflation: sanitized.inflation ?? {
        mode: 'single',
        baseYear: 2026,
        display: { seriesMode: 'nominal' },
      },
    };
    const series = computeSeries(input);
    expect(series).toHaveLength(1200);
  });
});

describe('inflationFactorSinceBase (defense in depth)', () => {
  it('does not hang for an extreme baseYear/calendarYear span', () => {
    const start = Date.now();
    const factor = inflationFactorSinceBase({
      mode: 'yearlyTable',
      baseYear: -1_000_000_000,
      calendarYear: 2026,
      yearlyRates: { 2025: 0.02 },
    });
    expect(Number.isFinite(factor)).toBe(true);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
