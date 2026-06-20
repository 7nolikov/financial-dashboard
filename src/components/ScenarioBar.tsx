import { useStore, type PresetName } from '../state/store';

/**
 * ScenarioBar — a single-line scenario switcher that sits directly above the
 * chart. Replaces the old block of six large preset cards: same entry point
 * ("start from a profile, then tweak"), a fraction of the vertical space, so
 * the chart keeps the screen.
 */

const PRESETS: { key: PresetName; label: string; icon: string }[] = [
  { key: 'worker', label: 'Worker', icon: '👷' },
  { key: 'investor', label: 'Investor', icon: '📈' },
  { key: 'businessman', label: 'Business', icon: '💼' },
  { key: 'loaner', label: 'Loaner', icon: '🎓' },
  { key: 'gig', label: 'Gig', icon: '🛵' },
  { key: 'average', label: 'Avg EU', icon: '😰' },
];

export function ScenarioBar({ onStartFresh }: { onStartFresh: () => void }) {
  const loadPreset = useStore((s) => s.loadPreset);
  const clearAllData = useStore((s) => s.clearAllData);
  const activePreset = useStore((s) => s.activePreset);
  const isCustom = activePreset === 'custom';

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="shrink-0 text-sm font-semibold text-foreground hidden md:inline">
        Scenario
      </span>
      <div
        role="radiogroup"
        aria-label="Financial scenario presets"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5"
      >
        {PRESETS.map(({ key, label, icon }) => {
          const active = activePreset === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={active}
              onClick={() => loadPreset(key)}
              className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-semibold transition-colors ${
                active
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {icon}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {isCustom && (
          <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold border border-primary/30">
            ✎ Custom
          </span>
        )}
        <button
          onClick={() => {
            clearAllData();
            onStartFresh();
          }}
          className="shrink-0 h-9 px-3 rounded-lg border border-border text-muted-foreground text-sm font-semibold hover:bg-muted hover:text-foreground transition-colors"
          title="Clear everything and build your own plan from scratch"
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}
