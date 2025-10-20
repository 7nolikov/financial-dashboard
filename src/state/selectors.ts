import { InflationMode, deflateToReal, inflationFactorSinceBase, indexAmountNominal } from '../lib/calc/inflation';
import type { Store } from './store';

export type SeriesPoint = { m: number; income: number; expense: number; invest: number; netWorth: number; safety: number };

export function computeSeries(state: Store): SeriesPoint[] {
  const months = 100 * 12;
  const points: SeriesPoint[] = [];
  let investmentsTotal = 0;
  let netWorth = 0;
  for (let m = 0; m < months; m++) {
    const calYear = new Date(state.dobISO).getFullYear() + Math.floor(m / 12);
    const inflFactor = inflationFactorSinceBase({
      mode: state.inflation.mode as InflationMode,
      baseYear: state.inflation.baseYear,
      calendarYear: calYear,
      singleRate: state.inflation.singleRate,
      yearlyRates: state.inflation.yearlyRates,
    });

    const employmentBase = sumActiveBy(state.incomes, m, (i) => i.category === 'employment');
    const otherIncomeBase = sumActiveBy(state.incomes, m, (i) => i.category !== 'employment');
    let incomeBase = employmentBase + otherIncomeBase;
    const expenseBase = sumActive(state.expenses, m);
    const contribBase = sumActiveContribution(state.investments, m);

    const income = state.inflation.applyTo.incomes ? indexAmountNominal(incomeBase, inflFactor) : incomeBase;
    const expense = state.inflation.applyTo.expenses ? indexAmountNominal(expenseBase, inflFactor) : expenseBase;
    const contrib = state.inflation.applyTo.contributions ? indexAmountNominal(contribBase, inflFactor) : contribBase;

    // investment growth (simplified single bucket)
    const apr = rateForAge(state, Math.floor(m / 12));
    const r_m = apr / 12;
    investmentsTotal = investmentsTotal * (1 + r_m) + contrib;

    // retirement withdraw (simplified)
    if (Math.floor(m / 12) >= (state.retirement?.age ?? 200)) {
      // stop employment income
      const employment = state.inflation.applyTo.incomes ? indexAmountNominal(employmentBase, inflFactor) : employmentBase;
      const incomeWithoutEmployment = income - employment;
      const needed = Math.max(0, expense - incomeWithoutEmployment);
      const withdraw = Math.min(needed, investmentsTotal);
      investmentsTotal -= withdraw;
      netWorth -= Math.max(0, needed - withdraw);
    }

    const netCashflow = income - expense - contrib;
    netWorth += netCashflow + 0; // investments delta already captured in investmentsTotal value

    const safetyTargetBase = safetyForMonth(state, m);
    const safetyTarget = state.inflation.applyTo.safetySavings ? indexAmountNominal(safetyTargetBase, inflFactor) : safetyTargetBase;

    let incomePlot = income, expensePlot = expense, investPlot = investmentsTotal, netPlot = netWorth, safetyPlot = safetyTarget;
    if (state.inflation.display.seriesMode === 'real') {
      incomePlot = deflateToReal(incomePlot, inflFactor);
      expensePlot = deflateToReal(expensePlot, inflFactor);
      investPlot = deflateToReal(investPlot, inflFactor);
      netPlot = deflateToReal(netPlot, inflFactor);
      safetyPlot = deflateToReal(safetyPlot, inflFactor);
    }

    points.push({ m, income: incomePlot, expense: expensePlot, invest: investPlot, netWorth: netPlot, safety: safetyPlot });
  }
  return points;
}

function sumActive(items: { amount: number; recurrence: any }[], m: number): number {
  let sum = 0;
  for (const it of items) {
    if (it.recurrence.kind === 'one_time') {
      if (it.recurrence.at.monthIndex === m) sum += it.amount;
    } else {
      const { start, end, everyMonths } = it.recurrence;
      if (m >= start.monthIndex && (end?.monthIndex == null || m <= end.monthIndex) && ((m - start.monthIndex) % everyMonths === 0)) sum += it.amount;
    }
  }
  return sum;
}

function sumActiveBy(items: any[], m: number, pred: (x: any) => boolean): number {
  return sumActive(items.filter(pred), m);
}

function sumActiveContribution(investments: { recurringAmount?: number; recurrence: any }[], m: number): number {
  let sum = 0;
  for (const inv of investments) {
    const amt = inv.recurringAmount ?? 0;
    const r = inv.recurrence;
    if (r.kind === 'recurring' && m >= r.start.monthIndex && (r.end?.monthIndex == null || m <= r.end.monthIndex) && ((m - r.start.monthIndex) % r.everyMonths === 0)) {
      sum += amt;
    }
  }
  return sum;
}

function rateForAge(state: Store, ageYears: number): number {
  // priority: yearlyTable if present, else fixed
  const table = state.investments.find((i) => i.model.type === 'yearlyTable' && i.model.yearlyRates);
  if (table && table.model.type === 'yearlyTable') {
    const r = table.model.yearlyRates![ageYears];
    if (typeof r === 'number') return r;
  }
  const fixed = state.investments.find((i) => i.model.type === 'fixed' && i.model.fixedRate != null);
  return fixed?.model.fixedRate ?? 0;
}

function safetyForMonth(state: Store, m: number): number {
  let v = 0;
  for (const r of state.safetySavings) {
    const s = r.start.monthIndex;
    const e = r.end?.monthIndex ?? 100 * 12;
    if (m >= s && m <= e) v = r.monthsCoverage * r.monthlyExpenses;
  }
  return v;
}


