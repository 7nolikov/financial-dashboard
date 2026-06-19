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
import { PresetBar } from './components/PresetBar';
import { Toaster, toast } from 'sonner';

/** Visible, numbered section header — gives the page a clear 1 → 2 → 3 path. */
function SectionHeader({
  step,
  id,
  title,
  subtitle,
}: {
  step: number;
  id: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3 sm:mb-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
        {step}
      </span>
      <div className="min-w-0">
        <h2 id={id} className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-50">
      <RealityCheck />
      <TopBar validation={wealthValidation} />
      <main className="mx-auto max-w-5xl xl:max-w-7xl px-4 sm:px-6 py-5 sm:py-7 safe-x space-y-5 sm:space-y-6">
        {/* =============================================================
             START HERE — always-visible scenario switcher. The entry point
             of the journey: pick a profile, then read 1 → 2 → 3 below.
             ============================================================= */}
        <section aria-label="Choose a scenario">
          <PresetBar
            onStartFresh={() => {
              setConfigOpen(true);
              setConfigTab('data');
            }}
          />
        </section>

        {/* =============================================================
             LEVELS 1 + 2 — the dashboard core. On xl the timeline is the
             hero (wide left column) and the snapshot rides alongside as a
             glanceable scorecard rail that stays put while you scroll. Below
             xl they stack — snapshot first (the "am I on track?" answer),
             then the chart. DOM order is snapshot → timeline so mobile reads
             1 → 2; `order` swaps them into hero-left / rail-right on xl.
             ============================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 xl:gap-6 items-stretch">
          {/* LEVEL 1 — Overview: the "am I on track?" answer at a glance. */}
          <section aria-labelledby="overview-heading" className="flex flex-col xl:order-2">
            <SectionHeader
              step={1}
              id="overview-heading"
              title="Your snapshot"
              subtitle="Where you stand today — income, net worth, and your FIRE grade at a glance."
            />
            <div className="space-y-3 sm:space-y-4">
              <OverviewCard />
              {(wealthValidation.warnings.length > 0 || wealthValidation.errors.length > 0) && (
                <WealthProtectionPanel validation={wealthValidation} />
              )}
            </div>
          </section>

          {/* LEVEL 2 — Visualization: interactive timeline for exploration.
              The card flexes to fill the column so its bottom edge always
              lines up with the snapshot rail (the chart plot grows/shrinks to
              match — see AreaChart's height handling). */}
          <section aria-labelledby="timeline-heading" className="flex flex-col min-w-0 xl:order-1">
            <SectionHeader
              step={2}
              id="timeline-heading"
              title="Your timeline"
              subtitle="How your money evolves across a 100-year life. Tap or hover to inspect any point."
            />
            <div
              id="timeline-capture"
              className="flex flex-1 flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
            >
              <AreaChart />
            </div>
          </section>
        </div>

        {/* =============================================================
             LEVEL 3 — Configuration: data entry and settings
             Progressive disclosure — collapsed by default on mobile so the
             chart stays the focus. On desktop it's expanded because space
             allows it. Tabs separate the two sub-sections.
             ============================================================= */}
        <section
          aria-labelledby="config-heading"
          className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
        >
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            aria-expanded={configOpen}
            aria-controls="config-panel"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                3
              </span>
              <div className="min-w-0">
                <h2
                  id="config-heading"
                  className="text-base sm:text-lg font-bold text-slate-900 leading-tight"
                >
                  Fine-tune your plan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Edit incomes, expenses, investments, loans, and other settings
                </p>
              </div>
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
                  className={`flex-1 sm:flex-none px-5 py-3 text-sm font-semibold transition-colors min-h-[44px] border-b-2 ${
                    configTab === 'data'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
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
                  className={`flex-1 sm:flex-none px-5 py-3 text-sm font-semibold transition-colors min-h-[44px] border-b-2 ${
                    configTab === 'settings'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
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
      <footer className="mt-6 sm:mt-8 border-t border-slate-200 bg-slate-900 text-white safe-bottom safe-x">
        <div className="mx-auto max-w-5xl xl:max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-400 transition-colors shadow-sm min-h-[44px]"
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
    // Only react when the URL actually carries a shared plan, so we can tell a
    // valid link from a malformed/truncated one and give the user feedback
    // instead of silently falling back to defaults.
    if (!window.location.hash.startsWith('#state=')) return;

    const shared = loadStateFromURL();
    // sanitizeSharedState returns {} when nothing in the payload was valid; an
    // empty merge would be a no-op, so treat that as a broken link too.
    const hasData = shared && Object.keys(shared).length > 0;

    if (hasData) {
      const current = useStore.getState();
      useStore.setState({ ...current, ...shared, chart: current.chart });
      toast.success('Shared plan loaded');
    } else {
      toast.error('This shared link is invalid or incomplete — showing your existing plan.');
    }
    // Clear the hash either way so a broken link isn't re-applied on reload.
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
