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
      bg: 'from-indigo-500 to-indigo-600',
      ring: 'ring-indigo-400',
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
      bg: 'from-orange-500 to-rose-500',
      ring: 'ring-orange-400',
      label: 'Significant gap ahead',
    };
  return {
    letter: 'F',
    bg: 'from-rose-500 to-rose-700',
    ring: 'ring-rose-500',
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
 *
 * On xl+ the card lives in the desktop sidebar next to the timeline (only
 * ~340px wide), so the KPI strip collapses to a compact 2-column grid there;
 * below xl it spans the full content width as a 3/6-across strip.
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
        ? 'bg-sky-500'
        : progress >= 50
          ? 'bg-indigo-500'
          : progress >= 25
            ? 'bg-amber-500'
            : 'bg-rose-400';

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* ── Financial Snapshot: 6 KPIs — always visible ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground leading-tight flex items-center gap-2">
            Snapshot
            <span className="text-muted-foreground text-xs font-normal">Age {currentAge}</span>
          </h3>
          {hasFire && (
            <button
              onClick={shareOnX}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-muted hover:bg-accent text-foreground rounded-lg text-xs font-semibold transition-colors border border-border"
              title="Share on X"
            >
              <span className="font-serif font-bold">𝕏</span>
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>

        {/* 6 core financial KPIs — the dashboard for everyone */}
        <div className="grid grid-cols-3 lg:grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100">
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
            color="text-rose-600"
            dot="bg-rose-500"
          />
          <Kpi
            label="Net Worth"
            value={fmt(currentNetWorth)}
            sub={currentNetWorth >= 0 ? 'Positive' : 'Negative'}
            color={currentNetWorth >= 0 ? 'text-indigo-600' : 'text-rose-600'}
            dot="bg-indigo-500"
          />
          <Kpi
            label="Investments"
            value={fmt(currentInvestments)}
            sub="Total portfolio"
            color="text-sky-600"
            dot="bg-sky-500"
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
            color={monthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}
            dot="bg-teal-500"
          />
        </div>

        {/* ── FIRE Section: Grade + metrics + progress — shown when expenses exist ── */}
        {hasFire && grade && (
          <div className="px-4 py-3 bg-muted/40 space-y-3">
            {/* Grade badge + headline */}
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${grade.bg} flex items-center justify-center shadow-sm`}
              >
                <span className="text-xl font-black text-white">{grade.letter}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground leading-tight">
                  {isFireAchieved ? '🎉 FIRE achieved' : 'FIRE grade'}
                </div>
                <div className="text-xs text-muted-foreground leading-tight">{grade.label}</div>
              </div>
            </div>

            {/* Key metrics — fixed 2-col grid so nothing reflows awkwardly */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <Metric label="Target" value={fmt(fireNumber)} />
              <Metric
                label="FIRE date"
                value={
                  isFireAchieved
                    ? 'Reached'
                    : fireAge != null
                      ? `Age ${fireAge} · ${fireYear}`
                      : 'Not reachable'
                }
                valueClass={fireAge == null && !isFireAchieved ? 'text-amber-600' : undefined}
              />
              <Metric
                label="Savings rate"
                value={`${savingsRate.toFixed(0)}%`}
                valueClass={
                  savingsRate >= 25
                    ? 'text-emerald-600'
                    : savingsRate >= 15
                      ? 'text-indigo-700'
                      : 'text-rose-600'
                }
              />
              {earlyByYears != null && !isFireAchieved ? (
                <Metric
                  label="vs. retirement"
                  value={`${earlyByYears}y early`}
                  valueClass="text-emerald-600"
                />
              ) : (
                <Metric label="Invested" value={fmt(currentInvestments)} />
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  FIRE progress
                </span>
                <span className="text-sm font-bold text-foreground">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          </div>
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
    <div className="px-3 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-lg font-black leading-none ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1 leading-none">{sub}</div>}
    </div>
  );
}

/** Compact label/value pair used in the FIRE metrics grid. */
function Metric({
  label,
  value,
  valueClass = 'text-slate-800',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground leading-none">{label}</div>
      <div className={`text-sm font-bold leading-tight mt-0.5 truncate ${valueClass}`}>{value}</div>
    </div>
  );
}
