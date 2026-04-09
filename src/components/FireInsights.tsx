import React from 'react';
import { useStore } from '../state/store';
import { computeSeries } from '../state/selectors';

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function FireInsights() {
  const state = useStore();
  const series = React.useMemo(() => computeSeries(state), [state]);

  const dobYear = new Date(state.dobISO).getFullYear();
  const currentYear = new Date().getFullYear();
  const currentAgeMonths = Math.max(0, (currentYear - dobYear) * 12);

  // Annual expenses = sum of monthly expenses active right now × 12
  const currentMonthPoint = series[Math.min(currentAgeMonths, series.length - 1)];
  const annualExpenses = (currentMonthPoint?.expense ?? 0) * 12;

  // FIRE number = 25× annual expenses (inverse of 4% safe withdrawal rate)
  const fireNumber = annualExpenses * 25;

  // Current investments
  const currentInvestments = currentMonthPoint?.invest ?? 0;

  // Find the month when investments first reach FIRE number
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

  // Progress toward FIRE number
  const progress = fireNumber > 0 ? Math.min(100, (currentInvestments / fireNumber) * 100) : 0;

  // Retirement age from settings
  const retirementAge = state.retirement?.age ?? 65;

  const isFireAchieved = fireMonth != null && fireMonth <= currentAgeMonths;
  const isFireBeforeRetirement = fireAge != null && fireAge < retirementAge;

  if (fireNumber <= 0 || annualExpenses <= 0) {
    return null; // Don't show if no expenses defined
  }

  return (
    <div className="mx-4 my-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">FIRE Insights</h3>
              <p className="text-blue-100 text-xs">Financial Independence, Retire Early</p>
            </div>
          </div>

          {/* The Big Number */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Your FIRE Number</div>
              <div className="text-white text-2xl font-black">{formatCurrency(fireNumber)}</div>
              <div className="text-blue-100 text-xs">25× annual expenses</div>
            </div>

            {fireAge != null && !isFireAchieved ? (
              <div className="text-center">
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">FIRE Date</div>
                <div className="text-white text-2xl font-black">Age {fireAge}</div>
                <div className="text-blue-100 text-xs">
                  {fireYear} • {yearsToFire != null && yearsToFire > 0 ? `${yearsToFire} years away` : 'soon!'}
                </div>
              </div>
            ) : isFireAchieved ? (
              <div className="text-center">
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Status</div>
                <div className="text-emerald-300 text-2xl font-black">FIRE'd! 🎉</div>
                <div className="text-blue-100 text-xs">You're financially independent</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Status</div>
                <div className="text-amber-300 text-2xl font-black">Not reached</div>
                <div className="text-blue-100 text-xs">Increase investments or cut expenses</div>
              </div>
            )}

            {isFireBeforeRetirement && fireAge != null && (
              <div className="text-center">
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Early Retire</div>
                <div className="text-emerald-300 text-2xl font-black">{retirementAge - fireAge}y early</div>
                <div className="text-blue-100 text-xs">vs. retirement at {retirementAge}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
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
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Current: {formatCurrency(currentInvestments)}</span>
          <span>Target: {formatCurrency(fireNumber)}</span>
        </div>
      </div>
    </div>
  );
}
