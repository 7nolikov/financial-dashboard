import React from 'react';
import { useStore } from '../state/store';
import { HelpModal } from './Help/HelpModal';
import { buildShareURL } from '../lib/sharing';

export function TopBar() {
  const setDOB = useStore((s) => s.setDOB);
  const dobISO = useStore((s) => s.dobISO);
  const inflation = useStore((s) => s.inflation);
  const setInflation = useStore((s) => s.setInflation);
  const setZoom = useStore((s) => s.setZoom);
  const [showHelp, setShowHelp] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function onShare() {
    useStore.getState().setOpenShare(true);
  }

  async function onCopyLink() {
    const state = useStore.getState();
    const url = buildShareURL(state);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg sm:text-xl">💰</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Financial Life Tracker
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Plan your path to financial independence</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide" title="Your date of birth. Ages on the chart use this.">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dobISO}
                  onChange={(e) => setDOB(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  title="Pick your birth date to align the timeline with your actual age"
                  min="1900-01-01"
                  max="2024-12-31"
                />
              </div>

              {/* Display Mode */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Display Mode</label>
                <select
                  value={inflation.display.seriesMode}
                  onChange={(e) => setInflation({ display: { seriesMode: e.target.value as 'nominal' | 'real' } })}
                  className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  title="Nominal: shows actual dollar amounts with inflation. Real: shows purchasing power adjusted for inflation."
                >
                  <option value="nominal">💰 Nominal (with inflation)</option>
                  <option value="real">📊 Real (inflation-adjusted)</option>
                </select>
              </div>

              {/* Inflation Rate */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide" title="Average yearly inflation rate. Used for all calculations.">
                  Inflation Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
                    onChange={(e) => setInflation({ singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100 })}
                    className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    title="Average yearly inflation rate (typically 2-3%)"
                  />
                  <span className="text-sm text-slate-500 font-medium">%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Actions</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setZoom(0, 100 * 12)}
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-400 transition-all font-medium"
                    title="Show full 0–100 years"
                  >
                    Reset Zoom
                  </button>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-400 transition-all font-medium"
                    title="Help, use cases and shortcuts"
                  >
                    ?
                  </button>
                  <button
                    onClick={onCopyLink}
                    className={`px-3 py-2 rounded-lg text-sm transition-all font-medium border ${
                      copied
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                    title="Copy shareable link to clipboard"
                  >
                    {copied ? '✓ Copied!' : '🔗 Share'}
                  </button>
                  <button
                    onClick={onShare}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-sm"
                    title="Preview and download as image"
                  >
                    JPG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}
