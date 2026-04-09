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
import { computeSeries } from './state/selectors';
import { validateWealthProtection } from './lib/validation/wealth-protection';
import { loadStateFromURL } from './lib/sharing';
import { useMemo, useEffect } from 'react';

export default function App() {
  const state = useStore();

  // Load state from URL hash on first mount (shared links)
  useEffect(() => {
    const shared = loadStateFromURL();
    if (shared) {
      // Merge shared state into store (preserve version, add defaults for any missing fields)
      const current = useStore.getState();
      useStore.setState({
        ...current,
        ...shared,
        chart: current.chart, // keep zoom at default
      });
      // Clean the hash from the URL so refreshing doesn't re-apply
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Compute wealth protection validation
  const wealthValidation = useMemo(() => {
    const series = computeSeries(state);
    const scenarios = series.map(point => ({
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
  }, [state]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <TopBar />
        <main className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          {/* Wealth Protection Panel */}
          {(wealthValidation.warnings.length > 0 || wealthValidation.errors.length > 0) && (
            <div className="mb-4 sm:mb-6">
              <WealthProtectionPanel validation={wealthValidation} />
            </div>
          )}

          {/* FIRE Insights — the viral hook */}
          <FireInsights />

          {/* Main Chart Section - Full Width */}
          <div className="mb-4 sm:mb-6">
            <div id="timeline-capture" className="shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-200">
              <AreaChart />
            </div>
          </div>

          {/* Control Panels - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="min-h-0 order-1 lg:order-1">
              <div className="h-full shadow-lg rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-200">
                <DataEntryPanel />
              </div>
            </div>
            <div className="min-h-0 order-2 lg:order-2">
              <div className="h-full shadow-lg rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-200">
                <SettingsPanel />
              </div>
            </div>
          </div>
        </main>
        <ShareModal />
      </div>
    </ErrorBoundary>
  );
}
