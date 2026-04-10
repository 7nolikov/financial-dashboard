import { InflationMode, deflateToReal, inflationFactorSinceBase, indexAmountNominal } from '../lib/calc/inflation';
import type { CoreState, Investment, Recurrence } from './store';

export type SeriesPoint = {
  m: number;
  income: number;
  expense: number;
  loans: number;
  invest: number;
  netWorth: number;
  safety: number;
  cashFlow: number;
  savingsDepleted: boolean;
  wealthWarning: boolean;
  investmentWithdrawal: number;
};

/**
 * Minimal input type for computeSeries — only the fields it actually reads.
 * This lets callers (and the SeriesContext) subscribe to only these fields,
 * so UI-only state changes (zoom, openShare) do NOT trigger recomputation.
 */
export type ComputationInput = Pick<
  CoreState,
  'dobISO' | 'incomes' | 'expenses' | 'investments' | 'loans' | 'safetySavings' | 'retirement' | 'inflation'
>;

export function computeSeries(state: ComputationInput): SeriesPoint[] {
  const months = 100 * 12;
  const points: SeriesPoint[] = [];
  // Track each investment's balance independently so each can grow at its own rate.
  const invBalances = new Map<string, number>();
  for (const inv of state.investments) invBalances.set(inv.id, 0);

  let loansTotal = 0;
  let netWorth = 0;
  let savingsDepleted = false;

  for (let m = 0; m < months; m++) {
    const calYear = new Date(state.dobISO).getFullYear() + Math.floor(m / 12);
    const inflFactor = inflationFactorSinceBase({
      mode: state.inflation.mode as InflationMode,
      baseYear: state.inflation.baseYear,
      calendarYear: calYear,
      singleRate: state.inflation.singleRate,
      yearlyRates: state.inflation.yearlyRates,
    });

    // Calculate base amounts (before inflation)
    const employmentBase = sumActiveBy(state.incomes, m, (i) => i.category === 'employment');
    const otherIncomeBase = sumActiveBy(state.incomes, m, (i) => i.category !== 'employment');
    const incomeBase = employmentBase + otherIncomeBase;
    const expenseBase = sumActive(state.expenses, m);

    // Apply inflation
    const income = indexAmountNominal(incomeBase, inflFactor);
    const expense = indexAmountNominal(expenseBase, inflFactor);

    // Calculate loan balance
    loansTotal = calculateLoanBalance(state, m);

    // Grow and contribute each investment individually using its own rate.
    const ageYears = Math.floor(m / 12);
    let contrib = 0;
    for (const inv of state.investments) {
      const r_m = rateForInvestment(inv, ageYears) / 12;
      let bal = (invBalances.get(inv.id) ?? 0) * (1 + r_m);
      const rec = inv.recurrence;
      if (rec.kind === 'recurring') {
        if (m === rec.start.monthIndex) bal += inv.principal;
        if (
          m >= rec.start.monthIndex &&
          (rec.end?.monthIndex == null || m <= rec.end.monthIndex) &&
          (m - rec.start.monthIndex) % rec.everyMonths === 0
        ) {
          const monthContrib = indexAmountNominal(inv.recurringAmount ?? 0, inflFactor);
          bal += monthContrib;
          contrib += monthContrib;
        }
      } else if (rec.kind === 'one_time' && m === rec.at.monthIndex) {
        bal += inv.principal;
      }
      invBalances.set(inv.id, bal);
    }

    let investmentsTotal = 0;
    for (const b of invBalances.values()) investmentsTotal += b;

    // Calculate available funds for expenses
    let availableFunds = income;
    const totalExpenses = expense;
    let investmentWithdrawal = 0;

    // Check if we're in retirement and need to withdraw from investments
    const isRetired = ageYears >= (state.retirement?.age ?? 200);

    if (isRetired) {
      // Stop employment income during retirement
      const employmentIncome = indexAmountNominal(employmentBase, inflFactor);
      availableFunds = income - employmentIncome;

      // Calculate required withdrawal based on retirement withdrawal rate
      const withdrawalRate = state.retirement?.withdrawalRate ?? 0.04;
      const monthlyWithdrawal = (investmentsTotal * withdrawalRate) / 12;

      // Calculate shortfall (expenses not covered by non-employment income)
      const uncoveredExpenses = Math.max(0, totalExpenses - availableFunds);

      // Withdraw from investments to cover shortfall
      investmentWithdrawal = Math.min(uncoveredExpenses, investmentsTotal);

      // Additional withdrawal for retirement income (if investments are sufficient)
      const remainingCapacity = investmentsTotal - investmentWithdrawal;
      investmentWithdrawal += Math.min(monthlyWithdrawal, remainingCapacity);

      // Update available funds
      availableFunds += investmentWithdrawal;
    } else {
      // During working years, check if expenses exceed income
      const shortfall = Math.max(0, totalExpenses - availableFunds);

      // If there's a shortfall, try to cover it with investments
      if (shortfall > 0 && investmentsTotal > 0) {
        investmentWithdrawal = Math.min(shortfall, investmentsTotal);
        availableFunds += investmentWithdrawal;
      }
    }

    // Deduct withdrawal proportionally from each investment so per-investment
    // tracking stays consistent with the total.
    if (investmentWithdrawal > 0 && investmentsTotal > 0) {
      const ratio = Math.min(1, investmentWithdrawal / investmentsTotal);
      for (const [id, bal] of invBalances) {
        invBalances.set(id, bal * (1 - ratio));
      }
      investmentsTotal = Math.max(0, investmentsTotal - investmentWithdrawal);
    }

    // Calculate net cash flow (cash in minus cash out, excluding withdrawals)
    const netCashflow = income - expense - contrib;

    // Update net worth: withdrawals ADD to cash because they cover expense
    // shortfalls. Subtracting them here (the old behavior) double-counted the
    // loss by charging the expense AND reducing cash by the amount withdrawn.
    netWorth += netCashflow + investmentWithdrawal;

    // Check if savings are depleted (negative net worth and no investments)
    const previousSavingsDepleted = savingsDepleted;
    savingsDepleted = netWorth < 0 && investmentsTotal <= 0;

    // Check for wealth warnings (negative net worth with investments available)
    const wealthWarning = netWorth < 0 && investmentsTotal > 0;

    // If savings just got depleted, this is an extremum point
    const isExtremumPoint = !previousSavingsDepleted && savingsDepleted;

    // Calculate safety target
    const safetyTargetBase = safetyForMonth(state, m);
    const safetyTarget = indexAmountNominal(safetyTargetBase, inflFactor);

    // Prepare values for plotting
    let incomePlot = income;
    let expensePlot = expense;
    let loansPlot = loansTotal;
    let investPlot = investmentsTotal;
    let netPlot = netWorth;
    let safetyPlot = safetyTarget;
    let cashFlowPlot = netCashflow;

    // Apply real vs nominal conversion
    if (state.inflation.display.seriesMode === 'real') {
      incomePlot = deflateToReal(incomePlot, inflFactor);
      expensePlot = deflateToReal(expensePlot, inflFactor);
      loansPlot = deflateToReal(loansPlot, inflFactor);
      investPlot = deflateToReal(investPlot, inflFactor);
      netPlot = deflateToReal(netPlot, inflFactor);
      safetyPlot = deflateToReal(safetyPlot, inflFactor);
      cashFlowPlot = deflateToReal(cashFlowPlot, inflFactor);
    }

    points.push({ 
      m, 
      income: incomePlot, 
      expense: expensePlot, 
      loans: loansPlot, 
      invest: investPlot, 
      netWorth: netPlot, 
      safety: safetyPlot,
      cashFlow: cashFlowPlot,
      savingsDepleted: isExtremumPoint,
      wealthWarning,
      investmentWithdrawal: state.inflation.display.seriesMode === 'real' ? deflateToReal(investmentWithdrawal, inflFactor) : investmentWithdrawal
    });
  }
  
  return points;
}

function sumActive(items: { amount: number; recurrence: Recurrence; category?: string }[], m: number): number {
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

function sumActiveBy(items: { amount: number; recurrence: Recurrence; category?: string }[], m: number, pred: (x: { amount: number; recurrence: Recurrence; category?: string }) => boolean): number {
  return sumActive(items.filter(pred), m);
}

/**
 * Growth rate for a specific investment at a given age. Each investment tracks
 * its own rate — using the first fixed rate globally (as before) conflates
 * unrelated investments and produces incorrect totals when rates differ.
 */
function rateForInvestment(inv: Investment, ageYears: number): number {
  if (inv.model.type === 'yearlyTable' && inv.model.yearlyRates) {
    const r = inv.model.yearlyRates[ageYears];
    if (typeof r === 'number') return r;
    // Fall back to closest earlier age with a defined rate
    const keys = Object.keys(inv.model.yearlyRates)
      .map((k) => Number(k))
      .filter((k) => !Number.isNaN(k) && k <= ageYears)
      .sort((a, b) => b - a);
    if (keys.length > 0) return inv.model.yearlyRates[keys[0]!] ?? 0;
    return 0;
  }
  return inv.model.fixedRate ?? 0;
}

function calculateLoanBalance(state: ComputationInput, m: number): number {
  let totalBalance = 0;

  for (const loan of state.loans) {
    // Check if loan is active at this month
    if (loan.recurrence.kind !== 'recurring') continue;

    const { start, end } = loan.recurrence;
    if (m < start.monthIndex || (end && m > end.monthIndex)) {
      continue; // Loan not active
    }

    const monthsElapsed = m - start.monthIndex;
    const monthlyRate = loan.interestRate / 12;

    let balance: number;
    if (monthlyRate > 0) {
      // Correct amortization: remaining balance after k payments of PMT on a
      // principal P at monthly rate r is
      //   B_k = P * (1 + r)^k - PMT * ((1 + r)^k - 1) / r
      // The previous formula computed the PV of an annuity using the loan's
      // principal as the payment, which is wrong.
      const growth = Math.pow(1 + monthlyRate, monthsElapsed);
      balance = loan.principal * growth - loan.monthlyPayment * ((growth - 1) / monthlyRate);
    } else {
      // No interest case
      balance = loan.principal - loan.monthlyPayment * monthsElapsed;
    }

    totalBalance += Math.max(0, balance);
  }

  return totalBalance;
}

function safetyForMonth(state: ComputationInput, m: number): number {
  let maxSafetyTarget = 0;
  
  for (const r of state.safetySavings) {
    const s = r.start.monthIndex;
    const e = r.end?.monthIndex ?? 100 * 12;
    
    if (m >= s && m <= e) {
      // Calculate current monthly expenses for this month
      const currentExpenses = sumActive(state.expenses, m);
      
      // Use the higher of rule's monthly expenses or current expenses
      const monthlyExpenses = Math.max(r.monthlyExpenses, currentExpenses);
      
      // Calculate safety target: months coverage × monthly expenses
      const safetyTarget = r.monthsCoverage * monthlyExpenses;
      
      // Take the maximum safety target across all active rules
      maxSafetyTarget = Math.max(maxSafetyTarget, safetyTarget);
    }
  }
  
  return maxSafetyTarget;
}


