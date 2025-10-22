import { InflationMode, deflateToReal, inflationFactorSinceBase, indexAmountNominal } from '../lib/calc/inflation';
import type { Store, Recurrence } from './store';

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

export function computeSeries(state: Store): SeriesPoint[] {
  const months = 100 * 12;
  const points: SeriesPoint[] = [];
  let investmentsTotal = 0;
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
    const contribBase = sumActiveContribution(state.investments, m);

    // Apply inflation
    const income = indexAmountNominal(incomeBase, inflFactor);
    const expense = indexAmountNominal(expenseBase, inflFactor);
    const contrib = indexAmountNominal(contribBase, inflFactor);

    // Calculate loan balance
    loansTotal = calculateLoanBalance(state, m);

    // Investment growth calculation
    const apr = rateForAge(state, Math.floor(m / 12));
    const r_m = apr / 12;
    
    // Add initial principal for investments that start this month
    const initialPrincipal = sumInitialPrincipal(state.investments, m);
    investmentsTotal = investmentsTotal * (1 + r_m) + contrib + initialPrincipal;

    // Calculate available funds for expenses
    let availableFunds = income;
    let totalExpenses = expense;
    let investmentWithdrawal = 0;
    let shortfall = 0;

    // Check if we're in retirement and need to withdraw from investments
    const isRetired = Math.floor(m / 12) >= (state.retirement?.age ?? 200);
    
    if (isRetired) {
      // Stop employment income during retirement
      const employmentIncome = indexAmountNominal(employmentBase, inflFactor);
      availableFunds = income - employmentIncome;
      
      // Calculate required withdrawal based on retirement withdrawal rate
      const withdrawalRate = state.retirement?.withdrawalRate ?? 0.04;
      const annualWithdrawal = investmentsTotal * withdrawalRate;
      const monthlyWithdrawal = annualWithdrawal / 12;
      
      // Calculate shortfall (expenses not covered by non-employment income)
      const uncoveredExpenses = Math.max(0, totalExpenses - availableFunds);
      
      // Withdraw from investments to cover shortfall
      investmentWithdrawal = Math.min(uncoveredExpenses, investmentsTotal);
      
      // Additional withdrawal for retirement income (if investments are sufficient)
      const remainingCapacity = investmentsTotal - investmentWithdrawal;
      const retirementIncome = Math.min(monthlyWithdrawal, remainingCapacity);
      investmentWithdrawal += retirementIncome;
      
      // Update available funds
      availableFunds += investmentWithdrawal;
      
      // Calculate final shortfall
      shortfall = Math.max(0, totalExpenses - availableFunds);
    } else {
      // During working years, check if expenses exceed income
      shortfall = Math.max(0, totalExpenses - availableFunds);
      
      // If there's a shortfall, try to cover it with investments
      if (shortfall > 0 && investmentsTotal > 0) {
        investmentWithdrawal = Math.min(shortfall, investmentsTotal);
        availableFunds += investmentWithdrawal;
        shortfall = Math.max(0, totalExpenses - availableFunds);
      }
    }

    // Update investment total after withdrawals
    investmentsTotal = Math.max(0, investmentsTotal - investmentWithdrawal);

    // Calculate net cash flow
    const netCashflow = income - expense - contrib;
    
    // Update net worth (accounting for investment withdrawals)
    netWorth += netCashflow - investmentWithdrawal;
    
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

function sumActiveContribution(investments: { recurringAmount?: number; recurrence: Recurrence }[], m: number): number {
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

function sumInitialPrincipal(investments: { principal: number; recurrence: Recurrence }[], m: number): number {
  let sum = 0;
  for (const inv of investments) {
    const r = inv.recurrence;
    if (r.kind === 'recurring' && m === r.start.monthIndex) {
      sum += inv.principal;
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

function calculateLoanBalance(state: Store, m: number): number {
  let totalBalance = 0;

  for (const loan of state.loans) {
    // Check if loan is active at this month
    if (loan.recurrence.kind !== 'recurring') continue;
    
    const { start, end } = loan.recurrence;
    if (m < start.monthIndex || (end && m > end.monthIndex)) {
      continue; // Loan not active
    }
    
    // Calculate remaining balance using amortization
    const monthsElapsed = m - start.monthIndex;
    const totalMonths = end ? end.monthIndex - start.monthIndex : 360; // Default 30 years if no end
    
    if (monthsElapsed >= totalMonths) {
      continue; // Loan paid off
    }
    
    // Simple amortization calculation
    const monthlyRate = loan.interestRate / 12;
    const remainingMonths = totalMonths - monthsElapsed;
    
    if (monthlyRate > 0) {
      // Standard amortization formula
      const balance = loan.principal * 
        (Math.pow(1 + monthlyRate, remainingMonths) - 1) / 
        (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths));
      totalBalance += Math.max(0, balance);
    } else {
      // No interest case
      const balance = loan.principal - (loan.monthlyPayment * monthsElapsed);
      totalBalance += Math.max(0, balance);
    }
  }
  
  return totalBalance;
}

function safetyForMonth(state: Store, m: number): number {
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


