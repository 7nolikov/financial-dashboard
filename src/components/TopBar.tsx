import React from 'react';
import { useStore } from '../state/store';
import { HelpModal } from './Help/HelpModal';

export function TopBar() {
  const setDOB = useStore((s) => s.setDOB);
  const dobISO = useStore((s) => s.dobISO);
  const inflation = useStore((s) => s.inflation);
  const setInflation = useStore((s) => s.setInflation);
  const setZoom = useStore((s) => s.setZoom);
  const [showHelp, setShowHelp] = React.useState(false);

  function onShare() {
    useStore.getState().setOpenShare(true);
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-5">
        {/* Single row on mobile: logo + title + action buttons */}
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-bold text-sm">💰</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Financial Life Tracker</h1>
              <p className="text-[10px] text-slate-500 leading-tight hidden xs:block">Plan your path to FIRE</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setZoom(0, 100 * 12)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs hover:bg-slate-50 transition-all font-medium text-slate-600"
              title="Show full 0–100 years"
            >
              ↺ Zoom
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs hover:bg-slate-50 transition-all font-medium text-slate-600"
              title="Help"
            >
              ?
            </button>
            <button
              onClick={onShare}
              className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-sm"
              title="Share your financial plan"
            >
              📤 Share
            </button>
          </div>
        </div>

        {/* Collapsible controls row on mobile */}
        <div className="mt-2 lg:mt-0 grid grid-cols-3 gap-2 lg:hidden">
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Birth Date</label>
            <input
              type="date"
              value={dobISO}
              onChange={(e) => setDOB(e.target.value)}
              className="w-full border border-slate-300 px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Values</label>
            <select
              value={inflation.display.seriesMode}
              onChange={(e) => setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })}
              className="w-full border border-slate-300 px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="nominal">Nominal</option>
              <option value="real">Real</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Inflation %</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
              onChange={(e) => setInflation({ singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100 })}
              className="w-full border border-slate-300 px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Full desktop layout — hidden on mobile */}
        <div className="hidden lg:flex lg:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">💰</span>
            </div>
            <div>
              <h1 className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Financial Life Tracker
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Plan your path to financial independence</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide" title="Your date of birth. Ages on the chart use this.">Date of Birth</label>
              <input
                type="date"
                value={dobISO}
                onChange={(e) => setDOB(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Display Mode</label>
              <select
                value={inflation.display.seriesMode}
                onChange={(e) => setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="nominal">💰 Nominal (with inflation)</option>
                <option value="real">📊 Real (inflation-adjusted)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide" title="Average yearly inflation rate.">Inflation Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
                  onChange={(e) => setInflation({ singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100 })}
                  className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <span className="text-sm text-slate-500 font-medium">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Actions</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoom(0, 100 * 12)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-400 transition-all font-medium"
                  title="Show full 0–100 years"
                >
                  Reset Zoom
                </button>
                <button
                  onClick={() => setShowHelp(true)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-all font-medium"
                  title="Help"
                >
                  ?
                </button>
                <button
                  onClick={onShare}
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-sm"
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
