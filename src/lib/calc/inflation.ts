export type InflationMode = 'single' | 'yearlyTable' | 'imported';

export function inflationFactorSinceBase(args: {
  mode: InflationMode;
  baseYear: number;
  calendarYear: number;
  singleRate?: number;
  yearlyRates?: Record<number, number>;
}): number {
  const { mode, calendarYear } = args;

  // Defense in depth: the table loops below iterate once per year between
  // baseYear and calendarYear. A malformed baseYear (e.g. from corrupted
  // localStorage) could otherwise spin for billions of iterations and freeze
  // the tab. Clamp the span to a range that comfortably covers the timeline.
  if (!Number.isFinite(calendarYear)) return 1;
  const baseYear = Number.isFinite(args.baseYear)
    ? Math.max(calendarYear - 300, Math.min(calendarYear + 300, args.baseYear))
    : calendarYear;

  // Handle case where calendar year is before base year (deflation)
  if (calendarYear < baseYear) {
    if (mode === 'single') {
      const r = args.singleRate ?? 0;
      const years = baseYear - calendarYear;
      return Math.pow(1 + r, -years); // Negative power for deflation
    }
    if (mode === 'yearlyTable') {
      const table = args.yearlyRates ?? {};
      let factor = 1;
      for (let y = calendarYear; y < baseYear; y++) {
        const r = table[y] ?? 0;
        factor *= 1 + r;
      }
      return 1 / factor; // Inverse for deflation
    }
    // For imported mode, treat same as yearly table
    const table = args.yearlyRates ?? {};
    let factor = 1;
    for (let y = calendarYear; y < baseYear; y++) {
      const r = table[y] ?? 0;
      factor *= 1 + r;
    }
    return 1 / factor;
  }

  // Normal case: calendar year >= base year (inflation)
  if (mode === 'single') {
    const r = args.singleRate ?? 0;
    const years = calendarYear - baseYear;
    return Math.pow(1 + r, years);
  }
  if (mode === 'yearlyTable') {
    const table = args.yearlyRates ?? {};
    let factor = 1;
    for (let y = baseYear; y < calendarYear; y++) {
      const r = table[y] ?? 0;
      factor *= 1 + r;
    }
    return factor;
  }
  // For imported mode, treat same as yearly table
  const table = args.yearlyRates ?? {};
  let factor = 1;
  for (let y = baseYear; y < calendarYear; y++) {
    const r = table[y] ?? 0;
    factor *= 1 + r;
  }
  return factor;
}

export function indexAmountNominal(baseAmount: number, factor: number): number {
  return baseAmount * factor;
}

export function deflateToReal(nominalAmount: number, factor: number): number {
  if (factor === 0) return nominalAmount;
  return nominalAmount / factor;
}
