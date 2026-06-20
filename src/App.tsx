import React, { useMemo, useEffect, useState } from 'react';
import { AreaChart } from './components/Timeline/AreaChart';
import { AppToolbar } from './components/AppToolbar';
import { ScenarioBar } from './components/ScenarioBar';
import { EditPlanDrawer } from './components/EditPlanDrawer';
import { ShareModal } from './components/Share/ShareModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WealthProtectionPanel } from './components/WealthProtection/WealthProtectionPanel';
import { OverviewCard } from './components/OverviewCard';
import { useStore } from './state/store';
import { SeriesProvider, useSeries } from './state/SeriesContext';
import { validateWealthProtection } from './lib/validation/wealth-protection';
import { loadStateFromURL } from './lib/sharing';
import { RealityCheck } from './components/RealityCheck';
import { Toaster, toast } from 'sonner';

/**
 * AppShell — a viewport-fit dashboard built around the chart.
 *
 * On large screens the layout is a single screen that never scrolls: a slim
 * toolbar, a snapshot rail on the left, and the timeline chart as the hero
 * filling the rest of the height. All data entry lives in the Edit-plan drawer
 * so the chart owns the page. Below `lg` it stacks chart-first, then snapshot.
 */
function AppShell() {
  const state = useStore();
  const series = useSeries();
  const [editOpen, setEditOpen] = useState(false);

  const wealthValidation = useMemo(() => {
    const scenarios = series.map((point) => ({
      monthIndex: point.m,
      netWorth: point.netWorth,
      investmentsTotal: point.invest,
      monthlyIncome: point.income,
      monthlyExpenses: point.expense,
      monthlyContributions: point.cashFlow > 0 ? point.cashFlow : 0,
      wealthWarning: point.wealthWarning,
      savingsDepleted: point.savingsDepleted,
      investmentWithdrawal: point.investmentWithdrawal,
    }));
    return validateWealthProtection(scenarios, state);
  }, [series, state]);

  const hasIssues = wealthValidation.warnings.length > 0 || wealthValidation.errors.length > 0;

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen lg:h-screen lg:overflow-hidden">
      <RealityCheck />
      <AppToolbar onEditPlan={() => setEditOpen(true)} validation={wealthValidation} />

      <main className="flex-1 lg:min-h-0">
        <div className="h-full flex flex-col lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Snapshot rail — "am I on track?" at a glance. Mobile shows it
              below the chart (order-2); desktop pins it left. */}
          <aside
            aria-label="Financial snapshot"
            className="order-2 lg:order-1 lg:border-r border-border lg:overflow-y-auto p-3 sm:p-4 space-y-3"
          >
            <OverviewCard />
            {hasIssues && <WealthProtectionPanel validation={wealthValidation} />}
          </aside>

          {/* Chart hero — the main thing. Fills all remaining height on desktop. */}
          <section
            aria-label="Financial projection timeline"
            className="order-1 lg:order-2 flex flex-col min-h-0 p-3 sm:p-4 gap-3"
          >
            <ScenarioBar onStartFresh={() => setEditOpen(true)} />
            <div
              id="timeline-capture"
              className="flex-1 min-h-[55vh] lg:min-h-0 flex flex-col rounded-2xl overflow-hidden bg-card border border-border shadow-sm"
            >
              <AreaChart />
            </div>
          </section>
        </div>
      </main>

      <EditPlanDrawer open={editOpen} onOpenChange={setEditOpen} />
      <ShareModal />
    </div>
  );
}

export default function App() {
  // Load state from URL hash on first mount (shared links)
  useEffect(() => {
    if (!window.location.hash.startsWith('#state=')) return;

    const shared = loadStateFromURL();
    const hasData = shared && Object.keys(shared).length > 0;

    if (hasData) {
      const current = useStore.getState();
      useStore.setState({ ...current, ...shared, chart: current.chart });
      toast.success('Shared plan loaded');
    } else {
      toast.error('This shared link is invalid or incomplete — showing your existing plan.');
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  return (
    <ErrorBoundary>
      <SeriesProvider>
        <AppShell />
        <Toaster position="top-center" richColors />
      </SeriesProvider>
    </ErrorBoundary>
  );
}
