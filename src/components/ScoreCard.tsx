import React from 'react';
import { useStore } from '../state/store';
import { useSeries } from '../state/SeriesContext';

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

function getGrade(
  progress: number,
  fireAge: number | null,
  retirementAge: number,
): { letter: string; color: string; bg: string } {
  if (progress >= 100)
    return { letter: 'A+', color: 'text-emerald-400', bg: 'from-emerald-500 to-teal-500' };
  if (fireAge != null && fireAge < retirementAge - 10)
    return { letter: 'A', color: 'text-emerald-400', bg: 'from-emerald-500 to-green-500' };
  if (fireAge != null && fireAge < retirementAge)
    return { letter: 'B', color: 'text-blue-400', bg: 'from-blue-500 to-indigo-500' };
  if (progress >= 40)
    return { letter: 'C', color: 'text-amber-400', bg: 'from-amber-500 to-orange-500' };
  if (progress >= 15)
    return { letter: 'D', color: 'text-orange-400', bg: 'from-orange-500 to-red-500' };
  return { letter: 'F', color: 'text-red-400', bg: 'from-red-500 to-red-700' };
}

/**
 * Financial Scorecard — a branded, screenshot-friendly visual summary.
 *
 * This is the thing people share. Not the chart, not a link — a card with
 * their "grade" and key numbers. Designed to provoke reactions:
 * "I got a C, what did you get?"
 */
export function ScoreCard() {
  const state = useStore();
  const series = useSeries();

  const dobYear = new Date(state.dobISO).getFullYear();
  const currentYear = new Date().getFullYear();
  const currentAgeMonths = Math.max(0, (currentYear - dobYear) * 12);
  const currentAge = Math.floor(currentAgeMonths / 12);

  const currentPoint = series[Math.min(currentAgeMonths, series.length - 1)];
  const annualExpenses = (currentPoint?.expense ?? 0) * 12;
  const fireNumber = annualExpenses * 25;
  const currentInvestments = currentPoint?.invest ?? 0;
  const monthlySavings = (currentPoint?.cashFlow ?? 0) > 0 ? currentPoint!.cashFlow : 0;
  const savingsRate = currentPoint?.income ? (monthlySavings / currentPoint.income) * 100 : 0;

  let fireAge: number | null = null;
  for (const point of series) {
    if (point.invest >= fireNumber && fireNumber > 0) {
      fireAge = Math.floor(point.m / 12);
      break;
    }
  }

  const retirementAge = state.retirement?.age ?? 65;
  const progress = fireNumber > 0 ? Math.min(100, (currentInvestments / fireNumber) * 100) : 0;
  const grade = getGrade(progress, fireAge, retirementAge);

  // Peak net worth
  let peakNetWorth = 0;
  let peakAge = 0;
  for (const point of series) {
    if (point.netWorth > peakNetWorth) {
      peakNetWorth = point.netWorth;
      peakAge = Math.floor(point.m / 12);
    }
  }

  if (annualExpenses <= 0) return null;

  return (
    <div
      id="scorecard-capture"
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-white/10"
    >
      {/* Header with grade */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white">Financial Scorecard</h3>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-semibold text-slate-300">
              2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Age {currentAge} · FIRE analysis</p>
        </div>
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${grade.bg} flex items-center justify-center shadow-lg`}
        >
          <span className="text-2xl sm:text-3xl font-black text-white">{grade.letter}</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-px bg-white/5">
        <div className="bg-slate-900/80 px-4 sm:px-5 py-3 sm:py-4">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            FIRE Number
          </div>
          <div className="text-lg sm:text-xl font-black text-white mt-1">{fmt(fireNumber)}</div>
        </div>
        <div className="bg-slate-900/80 px-4 sm:px-5 py-3 sm:py-4">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Progress
          </div>
          <div
            className={`text-lg sm:text-xl font-black mt-1 ${progress >= 100 ? 'text-emerald-400' : progress >= 50 ? 'text-blue-400' : 'text-amber-400'}`}
          >
            {progress.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-900/80 px-4 sm:px-5 py-3 sm:py-4">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            FIRE Age
          </div>
          <div
            className={`text-lg sm:text-xl font-black mt-1 ${fireAge != null ? (fireAge < retirementAge ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`}
          >
            {fireAge != null ? `Age ${fireAge}` : 'Not reached'}
          </div>
        </div>
        <div className="bg-slate-900/80 px-4 sm:px-5 py-3 sm:py-4">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Savings Rate
          </div>
          <div
            className={`text-lg sm:text-xl font-black mt-1 ${savingsRate >= 30 ? 'text-emerald-400' : savingsRate >= 15 ? 'text-blue-400' : 'text-red-400'}`}
          >
            {savingsRate.toFixed(0)}%
          </div>
        </div>
        <div className="bg-slate-900/80 px-4 sm:px-5 py-3 sm:py-4">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Peak Net Worth
          </div>
          <div className="text-lg sm:text-xl font-black text-white mt-1">{fmt(peakNetWorth)}</div>
          <div className="text-[10px] text-slate-500">at age {peakAge}</div>
        </div>
        <div className="bg-slate-900/80 px-4 sm:px-5 py-3 sm:py-4">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {fireAge != null && fireAge < retirementAge ? 'Early Retire By' : 'Retirement Gap'}
          </div>
          <div
            className={`text-lg sm:text-xl font-black mt-1 ${fireAge != null && fireAge < retirementAge ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {fireAge != null && fireAge < retirementAge
              ? `${retirementAge - fireAge} years`
              : fmt(Math.max(0, fireNumber - currentInvestments))}
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <div className="px-4 sm:px-5 py-3 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded flex items-center justify-center">
            <span className="text-[10px]">💰</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Financial Life Tracker</span>
        </div>
        <span className="text-[10px] text-slate-500">What's your grade? → finlife.app</span>
      </div>
    </div>
  );
}
