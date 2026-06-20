import React from 'react';
import { Settings2, Share2, HelpCircle } from 'lucide-react';
import { useStore } from '../state/store';
import { HelpModal } from './Help/HelpModal';
import type { WealthValidationResult } from '../lib/validation/wealth-protection';

/**
 * AppToolbar — the single, slim top bar of the app shell.
 *
 * Replaces the old multi-row TopBar. It carries only chrome that must be
 * reachable at all times: brand + health badge, the Nominal/Real display
 * toggle (the one control you flip while reading the chart), and the primary
 * actions. Everything else (date of birth, inflation, all data entry) lives in
 * the Edit-plan drawer so the chart can own the rest of the viewport.
 */
export function AppToolbar({
  onEditPlan,
  validation,
}: {
  onEditPlan: () => void;
  validation?: WealthValidationResult;
}) {
  const mode = useStore((s) => s.inflation.display.seriesMode);
  const setInflation = useStore((s) => s.setInflation);
  const setOpenShare = useStore((s) => s.setOpenShare);
  const [showHelp, setShowHelp] = React.useState(false);

  const errorCount = validation?.errors.length ?? 0;
  const warningCount = validation?.warnings.length ?? 0;

  return (
    <header className="shrink-0 z-40 bg-card/95 backdrop-blur-md border-b border-border safe-top safe-x">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 h-14">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <span className="text-primary-foreground text-base" aria-hidden="true">
              💰
            </span>
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-sm font-semibold text-foreground leading-none truncate">
              Financial Life Tracker
            </h1>
            <HealthLine errorCount={errorCount} warningCount={warningCount} />
          </div>
        </div>

        <div className="flex-1" />

        {/* Display-mode toggle — the control you flip while reading the chart. */}
        <ModeToggle mode={mode} onChange={(m) => setInflation({ display: { seriesMode: m } })} />

        {/* Actions */}
        <button
          onClick={onEditPlan}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
          title="Edit your incomes, expenses, investments, loans and assumptions"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Edit plan</span>
        </button>
        <button
          onClick={() => setOpenShare(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          title="Share your financial plan"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
          title="Help"
          aria-label="Open help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}

function HealthLine({ errorCount, warningCount }: { errorCount: number; warningCount: number }) {
  if (errorCount > 0) {
    return (
      <span className="text-[11px] font-medium text-rose-600 leading-none mt-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {errorCount} critical issue{errorCount !== 1 ? 's' : ''}
      </span>
    );
  }
  if (warningCount > 0) {
    return (
      <span className="text-[11px] font-medium text-amber-600 leading-none mt-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {warningCount} warning{warningCount !== 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <p className="text-[11px] text-muted-foreground leading-none mt-1 truncate">
      Plan your path to FIRE
    </p>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'nominal' | 'real';
  onChange: (m: 'nominal' | 'real') => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Chart display mode"
      className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border"
    >
      {(['nominal', 'real'] as const).map((m) => (
        <button
          key={m}
          role="radio"
          aria-checked={mode === m}
          onClick={() => onChange(m)}
          className={`px-2.5 sm:px-3 h-8 rounded-md text-xs font-semibold capitalize transition-colors ${
            mode === m
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={
            m === 'nominal'
              ? 'Nominal — future euros, including inflation'
              : 'Real — adjusted to today’s purchasing power'
          }
        >
          {m}
        </button>
      ))}
    </div>
  );
}
