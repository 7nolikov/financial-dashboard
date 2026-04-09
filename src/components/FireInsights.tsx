import React from 'react';
import { useStore } from '../state/store';
import { useSeries } from '../state/SeriesContext';
import { buildShareURL } from '../lib/sharing';

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// Lightweight confetti — pure CSS + JS, no extra dependency
const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            '--duration': p.duration,
            '--delay': p.delay,
            '--sway': p.sway,
          } as React.CSSProperties}
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
      text = `I'm already financially independent. FIRE number: ${formatCurrency(fireNumber)}. 100% there.\n\nMapped my entire financial life with this free tool — zero signup, data never leaves my browser. Run your numbers:`;
    } else if (fireAge != null && yearsToFire != null && yearsToFire > 0) {
      const gapToRetirement = retirementAge - (fireAge ?? retirementAge);
      const earlyStr = gapToRetirement > 0 ? ` — ${gapToRetirement} years before standard retirement` : '';
      text = `Just ran the numbers. My FIRE number is ${formatCurrency(fireNumber)} and I'm ${progress.toFixed(0)}% there.\n\nAt my current rate I'll hit financial independence at age ${fireAge}${earlyStr}.\n\nFree tool, zero signup, your data never leaves your browser. Try it:`;
    } else {
      text = `Hard truth: at my current savings rate I won't reach financial independence by retirement.\n\nI need ${formatCurrency(fireNumber)} and I'm only ${progress.toFixed(0)}% there at age ${currentAge}.\n\nFree tool that maps your entire financial life — zero signup. Check yours:`;
    }

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="mx-3 sm:mx-4 my-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Title row */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg sm:text-xl">{isFireAchieved ? '🎉' : '🔥'}</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg leading-tight">FIRE Insights</h3>
                <p className="text-blue-100 text-xs">Financial Independence, Retire Early</p>
              </div>
            </div>

            {/* Key metrics — wrap gracefully on mobile */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6">
              <div className="text-center bg-white/10 rounded-lg px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                <div className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wide">FIRE Number</div>
                <div className="text-white text-xl sm:text-2xl font-black">{formatCurrency(fireNumber)}</div>
                <div className="text-blue-100 text-[10px] sm:text-xs">25× annual expenses</div>
              </div>

              {fireAge != null && !isFireAchieved ? (
                <div className="text-center bg-white/10 rounded-lg px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wide">FIRE Date</div>
                  <div className="text-white text-xl sm:text-2xl font-black">Age {fireAge}</div>
                  <div className="text-blue-100 text-[10px] sm:text-xs">
                    {fireYear} · {yearsToFire != null && yearsToFire > 0 ? `${yearsToFire}y away` : 'soon!'}
                  </div>
                </div>
              ) : isFireAchieved ? (
                <div className="text-center bg-white/10 rounded-lg px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wide">Status</div>
                  <div className="text-emerald-300 text-xl sm:text-2xl font-black">FIRE'd! 🎉</div>
                  <div className="text-blue-100 text-[10px] sm:text-xs">Financially independent</div>
                </div>
              ) : (
                <div className="text-center bg-white/10 rounded-lg px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wide">Status</div>
                  <div className="text-amber-300 text-xl sm:text-2xl font-black">Not reached</div>
                  <div className="text-blue-100 text-[10px] sm:text-xs">Boost investments</div>
                </div>
              )}

              {isFireBeforeRetirement && fireAge != null && (
                <div className="text-center bg-white/10 rounded-lg px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0 col-span-2 sm:col-span-1">
                  <div className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wide">Early Retire</div>
                  <div className="text-emerald-300 text-xl sm:text-2xl font-black">{retirementAge - fireAge}y early</div>
                  <div className="text-blue-100 text-[10px] sm:text-xs">vs. age {retirementAge}</div>
                </div>
              )}
            </div>
          </div>

          {/* Share CTA inside gradient */}
          <div className="flex justify-end mt-2 sm:mt-0 sm:absolute sm:top-4 sm:right-6" style={{ position: 'relative' }}>
            <button
              onClick={shareFIREtweet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold transition-all border border-white/25"
              title="Tweet your FIRE progress"
            >
              <span>𝕏</span>
              <span className="hidden xs:inline">Share my FIRE number</span>
              <span className="xs:hidden">Share</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Progress to FIRE</span>
            <span className="text-sm font-bold text-indigo-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progress >= 100 ? 'bg-emerald-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-indigo-500' : progress >= 25 ? 'bg-violet-500' : 'bg-slate-400'
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
