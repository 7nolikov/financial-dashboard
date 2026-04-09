import React from 'react';
import { AreaChart } from './components/Timeline/AreaChart';
import { TopBar } from './components/TopBar';
import { DataEntryPanel } from './components/DataEntry/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ShareModal } from './components/Share/ShareModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WealthProtectionPanel } from './components/WealthProtection/WealthProtectionPanel';
import { FireInsights } from './components/FireInsights';
import { useStore } from './state/store';
import { SeriesProvider, useSeries } from './state/SeriesContext';
import { validateWealthProtection } from './lib/validation/wealth-protection';
import { loadStateFromURL } from './lib/sharing';
import { useMemo, useEffect } from 'react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <TopBar />
      <main className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 safe-x">
        {(wealthValidation.warnings.length > 0 || wealthValidation.errors.length > 0) && (
          <div className="mb-4 sm:mb-6">
            <WealthProtectionPanel validation={wealthValidation} />
          </div>
        )}

        <FireInsights />

        <div className="mb-4 sm:mb-6">
          <div id="timeline-capture" className="shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-200">
            <AreaChart />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="min-h-0 order-1">
            <div className="h-full shadow-lg rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-200">
              <DataEntryPanel />
            </div>
          </div>
          <div className="min-h-0 order-2">
            <div className="h-full shadow-lg rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-200">
              <SettingsPanel />
            </div>
          </div>
        </div>
      </main>

      {/* Viral footer CTA */}
      <footer className="border-t border-slate-200 bg-white safe-bottom safe-x">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-700">Know someone who should run their numbers?</p>
            <p className="text-xs text-slate-500">100% free · zero signup · data never leaves the browser</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => useStore.getState().setOpenShare(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm min-h-[44px]"
            >
              📤 Challenge a Friend
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
