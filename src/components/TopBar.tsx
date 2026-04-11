import React from 'react';
import { useStore } from '../state/store';
import { HelpModal } from './Help/HelpModal';
import type { WealthValidationResult } from '../lib/validation/wealth-protection';

interface TopBarProps {
  validation?: WealthValidationResult;
}

export function TopBar({ validation }: TopBarProps) {
  const setDOB = useStore((s) => s.setDOB);
  const dobISO = useStore((s) => s.dobISO);
  const inflation = useStore((s) => s.inflation);
  const setInflation = useStore((s) => s.setInflation);
  const setZoom = useStore((s) => s.setZoom);
  const [showHelp, setShowHelp] = React.useState(false);

  function onShare() {
    useStore.getState().setOpenShare(true);
  }

  const hasErrors = (validation?.errors.length ?? 0) > 0;
  const hasWarnings = (validation?.warnings.length ?? 0) > 0;
  const errorCount = validation?.errors.length ?? 0;
  const warningCount = validation?.warnings.length ?? 0;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm safe-top safe-x">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-5 lg:px-6 xl:px-8 py-3 sm:py-5">
        {/* Mobile: logo + title + action buttons. Buttons are icon-only to give
            the title enough room to never truncate on ~360px wide phones. */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <span className="text-white font-bold text-base" aria-hidden="true">
                💰
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                Financial Life Tracker
              </h1>
              {/* Health status badge — shows issues inline when present */}
              {hasErrors ? (
                <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1 leading-tight truncate mt-0.5">
                  <span aria-hidden="true">⚠</span>
                  <span className="truncate">
                    {errorCount} critical issue{errorCount !== 1 ? 's' : ''}
                  </span>
                </span>
              ) : hasWarnings ? (
                <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 leading-tight truncate mt-0.5">
                  <span aria-hidden="true">↘</span>
                  <span className="truncate">
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                </span>
              ) : (
                <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                  Plan your path to FIRE
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setZoom(0, 100 * 12)}
              className="w-10 h-10 flex items-center justify-center border border-slate-300 bg-white rounded-lg text-base hover:bg-slate-50 active:bg-slate-100 transition-colors font-medium text-slate-600 shrink-0"
              title="Show full 0–100 years"
              aria-label="Reset zoom to full 100-year view"
            >
              ↺
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 flex items-center justify-center border border-slate-300 bg-white rounded-lg text-base hover:bg-slate-50 active:bg-slate-100 transition-colors font-semibold text-slate-600 shrink-0"
              title="Help"
              aria-label="Open help"
            >
              ?
            </button>
            <button
              onClick={onShare}
              className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg text-base hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-colors font-semibold shadow-sm shrink-0"
              title="Share your financial plan"
              aria-label="Share your financial plan"
            >
              <span aria-hidden="true">📤</span>
            </button>
          </div>
        </div>

        {/* Mobile: controls row — Birth Date takes 2 cols to fit the locale date
            format; Mode and Inflation take one column each. bg-white is explicit
            so iOS Safari does not render date/select inputs as gray (disabled-
            looking) when the page has a tinted background. */}
        <div className="mt-3 grid grid-cols-4 gap-2 lg:hidden items-end">
          <div className="col-span-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Birth Date
            </label>
            <input
              type="date"
              value={dobISO}
              onChange={(e) => setDOB(e.target.value)}
              className="w-full h-11 bg-white border border-slate-300 px-2.5 rounded-lg text-[13px] text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Mode
            </label>
            <select
              value={inflation.display.seriesMode}
              onChange={(e) =>
                setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })
              }
              className="w-full h-11 bg-white border border-slate-300 px-2 rounded-lg text-[13px] text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="nominal">Nominal</option>
              <option value="real">Real</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Infl. %
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
              onChange={(e) =>
                setInflation({
                  singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100,
                })
              }
              className="w-full h-11 bg-white border border-slate-300 px-2.5 rounded-lg text-[13px] text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:flex lg:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">💰</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Financial Life Tracker
                </h1>
                {/* Desktop health badge */}
                {hasErrors ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                    <span>⚠</span>
                    <span>
                      {errorCount} issue{errorCount !== 1 ? 's' : ''}
                    </span>
                  </span>
                ) : hasWarnings ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    <span>↘</span>
                    <span>
                      {warningCount} warning{warningCount !== 1 ? 's' : ''}
                    </span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Plan your path to financial independence
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
                title="Your date of birth. Ages on the chart use this."
              >
                Date of Birth
              </label>
              <input
                type="date"
                value={dobISO}
                onChange={(e) => setDOB(e.target.value)}
                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Display Mode
              </label>
              <select
                value={inflation.display.seriesMode}
                onChange={(e) =>
                  setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })
                }
                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="nominal">💰 Nominal (with inflation)</option>
                <option value="real">📊 Real (inflation-adjusted)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
                title="Average yearly inflation rate."
              >
                Inflation Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
                  onChange={(e) =>
                    setInflation({
                      singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100,
                    })
                  }
                  className="flex-1 bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <span className="text-sm text-slate-500 font-semibold">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoom(0, 100 * 12)}
                  className="flex-1 px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm hover:bg-slate-50 hover:border-slate-400 transition-all font-medium text-slate-700"
                  title="Show full 0–100 years"
                >
                  Reset Zoom
                </button>
                <button
                  onClick={() => setShowHelp(true)}
                  className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm hover:bg-slate-50 transition-all font-medium text-slate-700"
                  title="Help"
                >
                  ?
                </button>
                <button
                  onClick={onShare}
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-sm"
                  title="Share your financial plan"
                >
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}
