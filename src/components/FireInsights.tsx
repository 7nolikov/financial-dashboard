import React from 'react';
import { useStore } from '../state/store';
import { useSeries } from '../state/SeriesContext';
import { buildShareURL } from '../lib/sharing';

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

// Lightweight confetti — pure CSS + JS, no extra dependency
const CONFETTI_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
];

function Confetti() {
  const particles = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 2}s`,
      delay: `${Math.random() * 1.5}s`,
      sway: `${1 + Math.random() * 1.5}s`,
      size: `${6 + Math.random() * 8}px`,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    }));
  }, []);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape,
              '--duration': p.duration,
              '--delay': p.delay,
              '--sway': p.sway,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

export function FireInsights() {
  const state = useStore();
  const series = useSeries();
  const [showConfetti, setShowConfetti] = React.useState(false);
  const confettiShownRef = React.useRef(false);

  const dobYear = new Date(state.dobISO).getFullYear();
  const currentYear = new Date().getFullYear();
  const currentAgeMonths = Math.max(0, (currentYear - dobYear) * 12);

  const currentMonthPoint = series[Math.min(currentAgeMonths, series.length - 1)];
  const annualExpenses = (currentMonthPoint?.expense ?? 0) * 12;
  const fireNumber = annualExpenses * 25;
  const currentInvestments = currentMonthPoint?.invest ?? 0;

  let fireMonth: number | null = null;
  for (const point of series) {
    if (point.invest >= fireNumber && fireNumber > 0) {
      fireMonth = point.m;
      break;
    }
  }

  const fireAge = fireMonth != null ? Math.floor(fireMonth / 12) : null;
  const fireYear = fireAge != null ? dobYear + fireAge : null;
  const yearsToFire = fireAge != null ? fireAge - Math.floor(currentAgeMonths / 12) : null;
  const progress = fireNumber > 0 ? Math.min(100, (currentInvestments / fireNumber) * 100) : 0;
  const retirementAge = state.retirement?.age ?? 65;
  const isFireAchieved = fireMonth != null && fireMonth <= currentAgeMonths;
  const isFireBeforeRetirement = fireAge != null && fireAge < retirementAge;

  // Trigger confetti once when FIRE is achieved
  React.useEffect(() => {
    if (isFireAchieved && !confettiShownRef.current) {
      confettiShownRef.current = true;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (!isFireAchieved) {
      confettiShownRef.current = false;
    }
  }, [isFireAchieved]);

  if (fireNumber <= 0 || annualExpenses <= 0) return null;

  function shareFIREtweet() {
    const currentStore = useStore.getState();
    const url = buildShareURL(currentStore);
    const currentAge = Math.floor(currentAgeMonths / 12);

    let text: string;
    if (isFireAchieved) {
      text = `While most Europeans face a €470K retirement gap, I mapped my financial life and hit my FIRE number: ${formatCurrency(fireNumber)}.\n\nIn 2026, knowing your number isn't optional. Free tool, zero signup:`;
    } else if (fireAge != null && yearsToFire != null && yearsToFire > 0) {
      const gapToRetirement = retirementAge - (fireAge ?? retirementAge);
      const earlyStr =
        gapToRetirement > 0 ? ` — ${gapToRetirement} years before the system says I can` : '';
      text = `The average European has a €470K retirement gap. I just ran my numbers.\n\nFIRE number: ${formatCurrency(fireNumber)}. ${progress.toFixed(0)}% there. Independence at age ${fireAge}${earlyStr}.\n\nWhat's YOUR number? Free, private, zero signup:`;
    } else {
      text = `Hard truth for 2026: I need ${formatCurrency(fireNumber)} to retire and I'm only ${progress.toFixed(0)}% there at age ${currentAge}.\n\nWith pensions shrinking and costs up 18% since 2020, the gap is real.\n\nFree tool that maps your entire financial life. Face your numbers:`;
    }

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Compact gradient header — always a single horizontal row */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg sm:text-xl">{isFireAchieved ? '🎉' : '🔥'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
                FIRE Insights
              </h3>
              <p className="text-blue-100 text-xs truncate">Financial Independence, Retire Early</p>
            </div>
            <button
              onClick={shareFIREtweet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 hover:bg-white/40 text-white rounded-lg text-xs font-semibold transition-all border border-white/60 shadow-sm shrink-0"
              title="Tweet your FIRE progress"
            >
              <span>𝕏</span>
              <span className="hidden sm:inline">Share my FIRE number</span>
              <span className="sm:hidden">Share</span>
            </button>
          </div>
        </div>

        {/* Key metrics — separated from gradient, always visible */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-around gap-3 sm:gap-6">
            <div className="text-center">
              <div className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                FIRE Number
              </div>
              <div className="text-slate-900 text-xl sm:text-2xl font-black">
                {formatCurrency(fireNumber)}
              </div>
              <div className="text-slate-400 text-[10px] sm:text-xs">25× annual expenses</div>
            </div>

            {fireAge != null && !isFireAchieved ? (
              <div className="text-center">
                <div className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                  FIRE Date
                </div>
                <div className="text-slate-900 text-xl sm:text-2xl font-black">Age {fireAge}</div>
                <div className="text-slate-400 text-[10px] sm:text-xs">
                  {fireYear} ·{' '}
                  {yearsToFire != null && yearsToFire > 0 ? `${yearsToFire}y away` : 'soon!'}
                </div>
              </div>
            ) : isFireAchieved ? (
              <div className="text-center">
                <div className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                  Status
                </div>
                <div className="text-emerald-600 text-xl sm:text-2xl font-black">FIRE'd! 🎉</div>
                <div className="text-slate-400 text-[10px] sm:text-xs">Financially independent</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                  Status
                </div>
                <div className="text-amber-500 text-xl sm:text-2xl font-black">Not reached</div>
                <div className="text-slate-400 text-[10px] sm:text-xs">Boost investments</div>
              </div>
            )}

            {isFireBeforeRetirement && fireAge != null && (
              <div className="text-center col-span-2 sm:col-span-1">
                <div className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                  Early Retire
                </div>
                <div className="text-emerald-600 text-xl sm:text-2xl font-black">
                  {retirementAge - fireAge}y early
                </div>
                <div className="text-slate-400 text-[10px] sm:text-xs">vs. age {retirementAge}</div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Progress to FIRE
            </span>
            <span className="text-sm font-bold text-indigo-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progress >= 100
                  ? 'bg-emerald-500'
                  : progress >= 75
                    ? 'bg-blue-500'
                    : progress >= 50
                      ? 'bg-indigo-500'
                      : progress >= 25
                        ? 'bg-violet-500'
                        : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-500">
            <span>Current: {formatCurrency(currentInvestments)}</span>
            <span>Target: {formatCurrency(fireNumber)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
