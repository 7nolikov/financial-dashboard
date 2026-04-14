import { useState } from 'react';
import { useStore } from '../state/store';

const PRESETS = [
  { key: 'worker', label: 'Worker', icon: '👷' },
  { key: 'investor', label: 'Investor', icon: '📈' },
  { key: 'businessman', label: 'Business', icon: '💼' },
  { key: 'loaner', label: 'Loaner', icon: '🎓' },
  { key: 'gig', label: 'Gig Worker', icon: '🛵' },
  { key: 'average', label: 'Avg European', icon: '😰' },
] as const;

const STORAGE_KEY = 'flt-quickstart-dismissed';

export function QuickStart({ onOpenConfig }: { onOpenConfig: () => void }) {
  const loadPreset = useStore((s) => s.loadPreset);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  function pickPreset(key: (typeof PRESETS)[number]['key']) {
    loadPreset(key);
    dismiss();
  }

  function startFromScratch() {
    onOpenConfig();
    dismiss();
  }

  if (dismissed) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5">
      <div className="text-center mb-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-800">Get started in seconds</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Pick a profile close to yours, then tweak the numbers
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {PRESETS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => pickPreset(key)}
            className="flex flex-col items-center gap-1 px-2 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm text-center min-h-[44px]"
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="text-center mt-3">
        <button
          onClick={startFromScratch}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Or start from scratch →
        </button>
      </div>
    </div>
  );
}
