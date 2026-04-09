import React from 'react';
import { useStore } from './store';
import { computeSeries, type SeriesPoint, type ComputationInput } from './selectors';

const SeriesContext = React.createContext<SeriesPoint[] | null>(null);

/**
 * Provides the computed financial series to the entire subtree.
 *
 * Key design: each slice is selected individually from Zustand, so Zustand's
 * reference-equality check means zoom changes (which only update `chart`) do
 * NOT cause any of these selectors to return a new value — and therefore do
 * NOT invalidate the useMemo, and do NOT trigger a re-computation of the
 * 1,200-month series.
 */
export function SeriesProvider({ children }: { children: React.ReactNode }) {
  const dobISO       = useStore((s) => s.dobISO);
  const incomes      = useStore((s) => s.incomes);
  const expenses     = useStore((s) => s.expenses);
  const investments  = useStore((s) => s.investments);
  const loans        = useStore((s) => s.loans);
  const safetySavings = useStore((s) => s.safetySavings);
  const retirement   = useStore((s) => s.retirement);
  const inflation    = useStore((s) => s.inflation);

  const input = React.useMemo<ComputationInput>(
    () => ({ dobISO, incomes, expenses, investments, loans, safetySavings, retirement, inflation }),
    [dobISO, incomes, expenses, investments, loans, safetySavings, retirement, inflation],
  );

  const series = React.useMemo(() => computeSeries(input), [input]);

  return <SeriesContext.Provider value={series}>{children}</SeriesContext.Provider>;
}

/** Consume the shared series. Must be used inside <SeriesProvider>. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSeries(): SeriesPoint[] {
  const ctx = React.useContext(SeriesContext);
  if (ctx === null) throw new Error('useSeries must be used inside <SeriesProvider>');
  return ctx;
}
