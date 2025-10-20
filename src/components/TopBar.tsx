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

  async function onShare() { useStore.getState().setOpenShare(true); }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">Financial Life Tracker</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600" title="Your date of birth. Ages on the chart use this.">Date of Birth</label>
            <input 
              type="date" 
              value={dobISO} 
              onChange={(e) => setDOB(e.target.value)} 
              className="border px-3 py-2 rounded text-sm min-w-[140px]" 
              title="Pick your birth date to align the timeline with your actual age"
              min="1900-01-01"
              max="2024-12-31"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Display Mode</label>
            <select
              value={inflation.display.seriesMode}
              onChange={(e) => setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })}
              className="border px-3 py-2 rounded text-sm min-w-[180px]"
              title="Nominal: shows actual dollar amounts with inflation. Real: shows purchasing power adjusted for inflation."
            >
              <option value="nominal">💰 Nominal (with inflation)</option>
              <option value="real">📊 Real (inflation-adjusted)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600" title="Average yearly inflation rate. Used for all calculations.">Inflation Rate</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
              onChange={(e) => setInflation({ singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100 })}
              className="w-20 border px-3 py-2 rounded text-sm"
              title="Average yearly inflation rate (typically 2-3%)"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
          <button onClick={() => setZoom(0, 100 * 12)} className="text-sm px-3 py-2 border rounded hover:bg-slate-50 transition-colors" title="Show full 0–100 years">Reset Zoom</button>
          <button onClick={() => setShowHelp(true)} className="text-sm px-3 py-2 border rounded hover:bg-slate-50 transition-colors" title="Help, use cases and shortcuts">?</button>
          <button onClick={onShare} className="text-sm px-3 py-2 border rounded bg-slate-900 text-white hover:opacity-90 transition-opacity" title="Preview and download as image">Share JPG</button>
        </div>
      </div>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}


