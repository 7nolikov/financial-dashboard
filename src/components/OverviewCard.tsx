import React from 'react';
import { useStore } from '../state/store';
import { useSeries } from '../state/SeriesContext';
import { buildShareURL } from '../lib/sharing';

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

function fmtSigned(n: number): string {
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${fmt(n)}`;
}

type Grade = { letter: string; bg: string; ring: string; label: string };

function getGrade(progress: number, fireAge: number | null, retirementAge: number): Grade {
  if (progress >= 100)
    return {
      letter: 'A+',
      bg: 'from-emerald-500 to-teal-500',
      ring: 'ring-emerald-400',
      label: 'FIRE achieved',
    };
  if (fireAge != null && fireAge < retirementAge - 10)
    return {
      letter: 'A',
      bg: 'from-emerald-500 to-green-600',
      ring: 'ring-emerald-400',
      label: 'Early retirement on track',
    };
  if (fireAge != null && fireAge < retirementAge)
    return {
      letter: 'B',
      bg: 'from-blue-500 to-indigo-600',
      ring: 'ring-blue-400',
      label: 'Retiring on schedule',
    };
  if (progress >= 40)
    return {
      letter: 'C',
      bg: 'from-amber-500 to-orange-500',
      ring: 'ring-amber-400',
      label: 'On track but needs boost',
    };
  if (progress >= 15)
    return {
      letter: 'D',
      bg: 'from-orange-500 to-red-500',
      ring: 'ring-orange-400',
      label: 'Significant gap ahead',
    };
  return {
    letter: 'F',
    bg: 'from-red-600 to-red-800',
    ring: 'ring-red-500',
    label: 'Critical — action required',
  };
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

/**
 * OverviewCard — Level 1 of the 3-level hierarchy.
 *
 * Dual-purpose card:
 * - Top: 6 financial KPIs (Income, Expenses, Net Worth, Investments, Loans, Cash Flow)
 *   Always visible — this is the core dashboard for ALL users.
 * - Bottom: FIRE grade + progress bar (the viral mechanic)
 *   Shown when expenses > 0 so FIRE number can be calculated.
 *
 * Never returns null — every user sees their financial snapshot.
 */
export function OverviewCard() {
  const state = useStore();
  const series = useSeries();
  const [showConfetti, setShowConfetti] = React.useState(false);
  const confettiShownRef = React.useRef(false);

  const dobYear = new Date(state.dobISO).getFullYear();
  const currentYear = new Date().getFullYear();
  const currentAgeMonths = Math.max(0, (currentYear - dobYear) * 12);
  const currentAge = Math.floor(currentAgeMonths / 12);

  const currentPoint = series[Math.min(currentAgeMonths, series.length - 1)];
  const monthlyIncome = currentPoint?.income ?? 0;
  const monthlyExpense = currentPoint?.expense ?? 0;
  const monthlyLoans = currentPoint?.loans ?? 0;
  const currentInvestments = currentPoint?.invest ?? 0;
  const currentNetWorth = currentPoint?.netWorth ?? 0;
  const monthlyCashFlow = currentPoint?.cashFlow ?? 0;

  // FIRE calculations — only meaningful when expenses exist
  const annualExpenses = monthlyExpense * 12;
  const fireNumber = annualExpenses * 25;
  const hasFire = fireNumber > 0 && annualExpenses > 0;

  const savingsRate =
    monthlyIncome > 0 ? Math.min(100, (Math.max(0, monthlyCashFlow) / monthlyIncome) * 100) : 0;

  let fireAge: number | null = null;
  let fireYear: number | null = null;
  if (hasFire) {
    for (const point of series) {
      if (point.invest >= fireNumber) {
        fireAge = Math.floor(point.m / 12);
        fireYear = dobYear + fireAge;
        break;
      }
    }
  }

  const retirementAge = state.retirement?.age ?? 65;
  const progress = hasFire ? Math.min(100, (currentInvestments / fireNumber) * 100) : 0;
  const isFireAchieved = fireAge != null && fireAge <= currentAge;
  const yearsToFire = fireAge != null ? fireAge - currentAge : null;
  const earlyByYears = fireAge != null && fireAge < retirementAge ? retirementAge - fireAge : null;
  const grade = hasFire ? getGrade(progress, fireAge, retirementAge) : null;

  React.useEffect(() => {
    if (isFireAchieved && !confettiShownRef.current) {
      confettiShownRef.current = true;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (!isFireAchieved) {
      confettiShownRef.current = false;
    }
  }, [isFireAchieved]);

  function shareOnX() {
    const url = buildShareURL(useStore.getState());
    let text: string;
    if (isFireAchieved) {
      text = `While most Europeans face a €470K retirement gap, I mapped my financial life and hit my FIRE number: ${fmt(fireNumber)}.\n\nIn 2026, knowing your number isn't optional. Free tool, zero signup:`;
    } else if (fireAge != null && yearsToFire != null && yearsToFire > 0) {
      const earlyStr =
        earlyByYears != null && earlyByYears > 0 ? ` — ${earlyByYears} years early` : '';
      text = `The average European has a €470K retirement gap. I just ran my numbers.\n\nFIRE number: ${fmt(fireNumber)}. ${progress.toFixed(0)}% there. Independence at age ${fireAge}${earlyStr}.\n\nWhat's YOUR number? Free, private, zero signup:`;
    } else {
      text = `Hard truth for 2026: I need ${fmt(fireNumber)} to retire and I'm only ${progress.toFixed(0)}% there at age ${currentAge}.\n\nWith pensions shrinking and costs up 18% since 2020, the gap is real.\n\nFree tool that maps your entire financial life:`;
    }
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400',
    );
  }

  const progressColor =
    progress >= 100
      ? 'bg-emerald-500'
      : progress >= 75
        ? 'bg-blue-500'
        : progress >= 50
          ? 'bg-indigo-500'
          : progress >= 25
            ? 'bg-amber-500'
            : 'bg-red-400';

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* ── Financial Snapshot: 6 KPIs — always visible ── */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
              📊 Financial Snapshot
              <span className="text-slate-400 text-xs font-normal ml-2">Age {currentAge}</span>
            </h3>
            {hasFire && (
              <button
                onClick={shareOnX}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-all border border-white/30"
                title="Share on X"
              >
                <span className="font-serif font-bold">𝕏</span>
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 core financial KPIs — the dashboard for everyone */}
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100">
          <Kpi
            label="Income"
            value={fmt(monthlyIncome)}
            sub="/month"
            color="text-emerald-600"
            dot="bg-emerald-500"
          />
          <Kpi
            label="Expenses"
            value={fmt(monthlyExpense)}
            sub="/month"
            color="text-red-600"
            dot="bg-red-500"
          />
          <Kpi
            label="Net Worth"
            value={fmt(currentNetWorth)}
            sub={currentNetWorth >= 0 ? 'Positive' : 'Negative'}
            color={currentNetWorth >= 0 ? 'text-violet-600' : 'text-red-600'}
            dot="bg-violet-500"
          />
          <Kpi
            label="Investments"
            value={fmt(currentInvestments)}
            sub="Total portfolio"
            color="text-blue-600"
            dot="bg-blue-500"
          />
          <Kpi
            label="Loans"
            value={fmt(monthlyLoans)}
            sub="Outstanding"
            color={monthlyLoans > 0 ? 'text-amber-600' : 'text-slate-400'}
            dot="bg-amber-500"
          />
          <Kpi
            label="Cash Flow"
            value={fmtSigned(monthlyCashFlow)}
            sub="/month"
            color={monthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}
            dot="bg-blue-400"
          />
        </div>

        {/* ── FIRE Section: Grade + Progress — shown when expenses exist ── */}
        {hasFire && grade && (
          <>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                {/* Grade badge */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-gradient-to-br ${grade.bg} flex items-center justify-center shadow-lg ring-2 ${grade.ring} ring-offset-2 ring-offset-white`}
                >
                  <span className="text-xl sm:text-2xl font-black text-white">{grade.letter}</span>
                </div>

                {/* FIRE metrics inline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {isFireAchieved ? '🎉 FIRE Achieved!' : '🔥 FIRE Grade'}
                    </span>
                    <span className="text-xs text-slate-500">{grade.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                    <span>
                      Target: <strong className="text-slate-800">{fmt(fireNumber)}</strong>
                    </span>
                    <span>
                      {isFireAchieved ? (
                        <strong className="text-emerald-600">Independent 🎉</strong>
                      ) : fireAge != null ? (
                        <>
                          FIRE at <strong className="text-slate-800">age {fireAge}</strong> (
                          {fireYear})
                        </>
                      ) : (
                        <strong className="text-amber-600">Not yet reachable</strong>
                      )}
                    </span>
                    {earlyByYears != null && !isFireAchieved && (
                      <span className="text-emerald-600 font-semibold">
                        {earlyByYears}y before retirement
                      </span>
                    )}
                    <span>
                      Savings rate:{' '}
                      <strong
                        className={
                          savingsRate >= 25
                            ? 'text-emerald-600'
                            : savingsRate >= 15
                              ? 'text-blue-700'
                              : 'text-red-600'
                        }
                      >
                        {savingsRate.toFixed(0)}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  FIRE Progress
                </span>
                <span className="text-sm font-bold text-slate-800">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>Invested: {fmt(currentInvestments)}</span>
                <span>Target: {fmt(fireNumber)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  color,
  dot,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  dot: string;
}) {
  return (
    <div className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={`text-base sm:text-lg font-black ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}
