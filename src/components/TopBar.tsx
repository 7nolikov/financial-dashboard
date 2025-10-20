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
              className="border px-2 py-1 rounded" 
              title="Pick your birth date to align the timeline with your actual age"
              min="1900-01-01"
              max="2024-12-31"
            />
          </div>
          <select
            value={inflation.display.seriesMode}
            onChange={(e) => setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })}
            className="border px-2 py-1 rounded text-sm"
            title="Nominal: shows actual dollar amounts with inflation. Real: shows purchasing power adjusted for inflation."
          >
            <option value="nominal">Nominal (with inflation)</option>
            <option value="real">Real (inflation-adjusted)</option>
          </select>
          <div className="flex items-center gap-1 text-sm">
            <span title="Average yearly inflation rate. Used for all calculations.">Inflation %</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
              onChange={(e) => setInflation({ singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100 })}
              className="w-20 border px-2 py-1 rounded"
              title="Average yearly inflation rate (typically 2-3%)"
            />
          </div>
          <button onClick={() => setZoom(0, 100 * 12)} className="text-xs px-2 py-1 border rounded hover:bg-slate-50" title="Show full 0–100 years">Reset Zoom</button>
          <button onClick={() => setShowHelp(true)} className="text-xs px-2 py-1 border rounded hover:bg-slate-50" title="Help, use cases and shortcuts">?</button>
          <button onClick={onShare} className="text-xs px-2 py-1 border rounded bg-slate-900 text-white hover:opacity-90" title="Preview and download as image">Share JPG</button>
        </div>
      </div>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}


