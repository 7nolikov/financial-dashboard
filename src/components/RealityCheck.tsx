import React from 'react';
import { useStore } from '../state/store';

/**
 * Reality Check — the emotional hook that drives virality.
 *
 * Shows shocking 2026-relevant financial statistics BEFORE users dive into
 * their data. The goal: create an emotional reaction (fear, urgency, curiosity)
 * that makes people (a) engage with the tool and (b) share it.
 *
 * Dismissed after the user clicks "Run My Numbers" — stored in sessionStorage
 * so it reappears on fresh visits but doesn't nag returning users in the same session.
 */

const CRISIS_STATS = [
  {
    icon: '🏠',
    stat: '72%',
    label: "of under-35s in Europe can't afford a home in 2026",
    source: 'ECB Housing Report',
  },
  {
    icon: '🤖',
    stat: '40%',
    label: 'of current jobs at risk from AI automation by 2030',
    source: 'OECD Employment Outlook',
  },
  {
    icon: '📉',
    stat: '€470K',
    label: 'average retirement gap for Europeans who rely on state pension alone',
    source: 'European Pension Gap Study',
  },
  {
    icon: '💸',
    stat: '-18%',
    label: 'real purchasing power lost since 2020 for median earners',
    source: 'Eurostat CPI Data',
  },
];

export function RealityCheck() {
  const [dismissed, setDismissed] = React.useState(() => {
    return sessionStorage.getItem('flt-reality-dismissed') === '1';
  });
  const [currentStat, setCurrentStat] = React.useState(0);
  const loadPreset = useStore((s) => s.loadPreset);

  React.useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % CRISIS_STATS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [dismissed]);

  if (dismissed) return null;

  function handleDismiss(preset?: 'average' | 'worker') {
    sessionStorage.setItem('flt-reality-dismissed', '1');
    if (preset) {
      loadPreset(preset);
      sessionStorage.setItem('flt-quickstart-dismissed', '1');
    }
    setDismissed(true);
  }

  const stat = CRISIS_STATS[currentStat]!;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Rotating crisis stat */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-400/30 rounded-full text-red-300 text-xs font-semibold mb-4 sm:mb-6">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            2026 Financial Reality
          </div>

          <div className="min-h-[120px] sm:min-h-[100px] flex flex-col items-center justify-center transition-all duration-500">
            <div className="text-4xl sm:text-5xl mb-3">{stat.icon}</div>
            <div className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-red-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">
              {stat.stat}
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              {stat.label}
            </p>
          </div>

          {/* Stat dots */}
          <div className="flex justify-center gap-2 mt-4">
            {CRISIS_STATS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStat(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStat ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Show statistic ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Do you know <span className="text-amber-300">your</span> number?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Map your entire financial life in 60 seconds. See exactly when — or if — you'll reach
            financial independence. 100% private, no signup.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleDismiss('average')}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg shadow-red-500/25 transition-all min-h-[48px]"
            >
              😰 Show Me the Average European Reality
            </button>
            <button
              onClick={() => handleDismiss()}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm sm:text-base font-semibold transition-all min-h-[48px]"
            >
              I'll enter my own data →
            </button>
          </div>

          <p className="text-[11px] text-slate-500 pt-2">
            Zero data leaves your browser · No account needed · Open source
          </p>
        </div>
      </div>
    </div>
  );
}
