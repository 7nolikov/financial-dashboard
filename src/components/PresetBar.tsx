import { useStore, type PresetName } from '../state/store';

/**
 * PresetBar — the always-visible scenario switcher and entry point of the
 * customer journey ("Start here"). Lets users instantly explore different
 * financial profiles, highlights the active one, and surfaces a "Custom plan"
 * state once they edit anything. Replaces both the empty-state-only QuickStart
 * strip and the preset <select> that used to be buried in the Data Entry panel.
 */

const PRESETS: { key: PresetName; label: string; icon: string; blurb: string }[] = [
  { key: 'worker', label: 'Worker', icon: '👷', blurb: 'Salaried career' },
  { key: 'investor', label: 'Investor', icon: '📈', blurb: 'High saver, early FIRE' },
  { key: 'businessman', label: 'Business', icon: '💼', blurb: 'Self-employed owner' },
  { key: 'loaner', label: 'Loaner', icon: '🎓', blurb: 'Debt-heavy start' },
  { key: 'gig', label: 'Gig Worker', icon: '🛵', blurb: 'No pension, variable' },
  { key: 'average', label: 'Avg European', icon: '😰', blurb: 'The wake-up call' },
];

export function PresetBar({ onStartFresh }: { onStartFresh: () => void }) {
  const loadPreset = useStore((s) => s.loadPreset);
  const clearAllData = useStore((s) => s.clearAllData);
  const activePreset = useStore((s) => s.activePreset);
  const isCustom = activePreset === 'custom';

  function startFresh() {
    clearAllData();
    onStartFresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
            ▶
          </span>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Start here — choose a scenario
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pick a profile to explore, then fine-tune the numbers below. Switch anytime.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCustom && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200">
              ✎ Custom plan
            </span>
          )}
          <button
            onClick={startFresh}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all min-h-[36px]"
            title="Clear everything and build your own plan from scratch"
          >
            Start fresh
          </button>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Financial scenario presets"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-5 pb-4"
      >
        {PRESETS.map(({ key, label, icon, blurb }) => {
          const active = activePreset === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={active}
              onClick={() => loadPreset(key)}
              className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                active
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base leading-none">{icon}</span>
                <span
                  className={`text-xs sm:text-sm font-bold leading-tight ${
                    active ? 'text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  {label}
                </span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
                {blurb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
