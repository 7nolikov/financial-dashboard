import React from 'react';
import { AreaChart } from './components/Timeline/AreaChart';
import { TopBar } from './components/TopBar';
import { DataEntryPanel } from './components/DataEntry/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ShareModal } from './components/Share/ShareModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WealthProtectionPanel } from './components/WealthProtection/WealthProtectionPanel';
import { OverviewCard } from './components/OverviewCard';
import { useStore } from './state/store';
import { SeriesProvider, useSeries } from './state/SeriesContext';
import { validateWealthProtection } from './lib/validation/wealth-protection';
import { loadStateFromURL } from './lib/sharing';
import { useMemo, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RealityCheck } from './components/RealityCheck';
import { QuickStart } from './components/QuickStart';

/** Inner shell — has access to SeriesContext. */
function AppShell() {
  const state = useStore();
  const series = useSeries();

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

  // Level 3 disclosure state — the configuration panels start collapsed on
  // mobile so users see the chart first, but are expanded on desktop where
  // there's plenty of screen real estate.
  const [configOpen, setConfigOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const [configTab, setConfigTab] = useState<'data' | 'settings'>('data');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <RealityCheck />
      <TopBar validation={wealthValidation} />
      <main className="mx-auto max-w-[1600px] px-4 sm:px-5 lg:px-6 xl:px-8 py-4 sm:py-6 safe-x space-y-4 sm:space-y-6 lg:space-y-8">
        {/* =============================================================
             LEVEL 1 — Overview: the "am I on track?" answer at a glance
             Always visible, concise, no interaction required.
             ============================================================= */}
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="sr-only">
            Overview
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <OverviewCard />
            <QuickStart
              onOpenConfig={() => {
                setConfigOpen(true);
                setConfigTab('data');
              }}
            />
            {(wealthValidation.warnings.length > 0 || wealthValidation.errors.length > 0) && (
              <WealthProtectionPanel validation={wealthValidation} />
            )}
          </div>
        </section>

        {/* =============================================================
             LEVEL 2 — Visualization: interactive timeline for exploration
             Always visible, main working area.
             ============================================================= */}
        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="sr-only">
            Financial Timeline
          </h2>
          <div
            id="timeline-capture"
            className="shadow-md sm:shadow-xl rounded-2xl overflow-hidden bg-white border border-slate-200"
          >
            <AreaChart />
          </div>
        </section>

        {/* =============================================================
             LEVEL 3 — Configuration: data entry and settings
             Progressive disclosure — collapsed by default on mobile so the
             chart stays the focus. On desktop it's expanded because space
             allows it. Tabs separate the two sub-sections.
             ============================================================= */}
        <section
          aria-labelledby="config-heading"
          className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md sm:shadow-lg"
        >
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 transition-colors text-left"
            aria-expanded={configOpen}
            aria-controls="config-panel"
          >
            <div className="min-w-0">
              <h2
                id="config-heading"
                className="text-base sm:text-lg font-bold text-slate-900 leading-tight"
              >
                Configure Your Plan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Edit incomes, expenses, investments, loans, and other settings
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-slate-600">
              <span className="text-xs font-semibold hidden sm:inline">
                {configOpen ? 'Hide' : 'Show'}
              </span>
              {configOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>

          {configOpen && (
            <div id="config-panel" className="border-t border-slate-200">
              {/* Tab bar — lets users focus on data OR settings without
                  overwhelming the screen with both at once. */}
              <div
                role="tablist"
                aria-label="Configuration sections"
                className="flex border-b border-slate-200 bg-slate-50/60"
              >
                <button
                  role="tab"
                  aria-selected={configTab === 'data'}
                  aria-controls="tab-panel-data"
                  id="tab-data"
                  onClick={() => setConfigTab('data')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-semibold transition-colors min-h-[44px] border-b-2 ${
                    configTab === 'data'
                      ? 'border-blue-600 text-blue-700 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  Data Entry
                </button>
                <button
                  role="tab"
                  aria-selected={configTab === 'settings'}
                  aria-controls="tab-panel-settings"
                  id="tab-settings"
                  onClick={() => setConfigTab('settings')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-semibold transition-colors min-h-[44px] border-b-2 ${
                    configTab === 'settings'
                      ? 'border-blue-600 text-blue-700 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  Settings
                </button>
              </div>

              {configTab === 'data' && (
                <div role="tabpanel" id="tab-panel-data" aria-labelledby="tab-data">
                  <DataEntryPanel />
                </div>
              )}
              {configTab === 'settings' && (
                <div role="tabpanel" id="tab-panel-settings" aria-labelledby="tab-settings">
                  <SettingsPanel />
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Viral footer CTA — urgency-driven */}
      <footer className="mt-6 sm:mt-8 border-t border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-900 text-white safe-bottom safe-x">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-white">
              Most people won't retire when they think they will.
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Challenge someone to face their real numbers — 100% free, zero signup, totally
              private.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => useStore.getState().setOpenShare(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-sm font-bold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/25 min-h-[44px]"
            >
              🔥 Challenge a Friend
            </button>
          </div>
        </div>
      </footer>

      <ShareModal />
    </div>
  );
}

export default function App() {
  // Load state from URL hash on first mount (shared links)
  useEffect(() => {
    const shared = loadStateFromURL();
    if (shared) {
      const current = useStore.getState();
      useStore.setState({ ...current, ...shared, chart: current.chart });
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <ErrorBoundary>
      <SeriesProvider>
        <AppShell />
      </SeriesProvider>
    </ErrorBoundary>
  );
}
