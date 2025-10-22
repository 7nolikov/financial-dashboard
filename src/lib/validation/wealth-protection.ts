import type { Store, Investment, Expense, Income } from '../../state/store';

export type WealthValidationResult = {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
};

export type WealthScenario = {
  monthIndex: number;
  netWorth: number;
  investmentsTotal: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyContributions: number;
  wealthWarning: boolean;
  savingsDepleted: boolean;
};

/**
 * Validates financial scenarios to prevent negative wealth when investments are available
 */
export function validateWealthProtection(
  scenarios: WealthScenario[],
  state: Store
): WealthValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check for negative wealth scenarios with available investments
  const negativeWealthWithInvestments = scenarios.filter(
    s => s.wealthWarning && s.investmentsTotal > 0
  );

  if (negativeWealthWithInvestments.length > 0) {
    warnings.push(
      `Found ${negativeWealthWithInvestments.length} months with negative net worth despite available investments`
    );
    
    // Analyze the pattern
    const consecutiveMonths = findConsecutiveNegativeWealth(negativeWealthWithInvestments);
    if (consecutiveMonths > 6) {
      errors.push(
        `Extended period of negative wealth (${consecutiveMonths} months) - consider reducing expenses or increasing income`
      );
    }
  }

  // Check for savings depletion scenarios
  const savingsDepletedScenarios = scenarios.filter(s => s.savingsDepleted);
  if (savingsDepletedScenarios.length > 0) {
    errors.push(
      `Savings depleted in ${savingsDepletedScenarios.length} months - critical financial risk`
    );
  }

  // Check investment contribution vs expenses ratio
  const avgContribution = scenarios.reduce((sum, s) => sum + s.monthlyContributions, 0) / scenarios.length;
  const avgExpenses = scenarios.reduce((sum, s) => sum + s.monthlyExpenses, 0) / scenarios.length;
  const avgIncome = scenarios.reduce((sum, s) => sum + s.monthlyIncome, 0) / scenarios.length;

  if (avgContribution > avgIncome * 0.5) {
    warnings.push(
      'High investment contribution rate (>50% of income) - ensure sufficient emergency fund'
    );
  }

  if (avgExpenses > avgIncome * 0.9) {
    warnings.push(
      'High expense ratio (>90% of income) - consider reducing expenses or increasing income'
    );
  }

  // Generate suggestions based on analysis
  if (negativeWealthWithInvestments.length > 0) {
    suggestions.push('Consider reducing monthly expenses');
    suggestions.push('Increase emergency fund target');
    suggestions.push('Review investment withdrawal strategy');
  }

  if (savingsDepletedScenarios.length > 0) {
    suggestions.push('Build larger emergency fund');
    suggestions.push('Reduce high-risk expenses');
    suggestions.push('Consider additional income sources');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions
  };
}

/**
 * Analyzes preset data for logical consistency
 */
export function validatePresetData(presetName: string, state: Store): WealthValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check income vs expense ratios
  const totalMonthlyIncome = state.incomes.reduce((sum, income) => {
    if (income.recurrence.kind === 'recurring') {
      return sum + income.amount;
    }
    return sum;
  }, 0);

  const totalMonthlyExpenses = state.expenses.reduce((sum, expense) => {
    if (expense.recurrence.kind === 'recurring') {
      return sum + expense.amount;
    }
    return sum;
  }, 0);

  const totalMonthlyContributions = state.investments.reduce((sum, investment) => {
    return sum + (investment.recurringAmount || 0);
  }, 0);

  const totalMonthlyLoans = state.loans.reduce((sum, loan) => {
    return sum + loan.monthlyPayment;
  }, 0);

  // Check if expenses exceed income
  if (totalMonthlyExpenses > totalMonthlyIncome) {
    errors.push(
      `Monthly expenses ($${totalMonthlyExpenses.toLocaleString()}) exceed income ($${totalMonthlyIncome.toLocaleString()})`
    );
  }

  // Check if contributions are too high relative to available income
  const availableAfterExpenses = totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyLoans;
  if (totalMonthlyContributions > availableAfterExpenses) {
    warnings.push(
      `Investment contributions ($${totalMonthlyContributions.toLocaleString()}) exceed available income after expenses and loans ($${availableAfterExpenses.toLocaleString()})`
    );
  }

  // Check emergency fund adequacy
  const emergencyFundMonths = state.safetySavings.reduce((max, rule) => {
    return Math.max(max, rule.monthsCoverage);
  }, 0);

  if (emergencyFundMonths < 3) {
    warnings.push(
      `Emergency fund target (${emergencyFundMonths} months) may be insufficient - consider 3-6 months minimum`
    );
  }

  // Check retirement age vs investment strategy
  if (state.retirement && state.retirement.age < 55) {
    const yearsToRetirement = state.retirement.age - getCurrentAge(state);
    if (yearsToRetirement < 20 && totalMonthlyContributions < totalMonthlyIncome * 0.2) {
      warnings.push(
        'Early retirement target may require higher savings rate (20%+ of income)'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions
  };
}

/**
 * Finds consecutive months with negative wealth
 */
function findConsecutiveNegativeWealth(scenarios: WealthScenario[]): number {
  if (scenarios.length === 0) return 0;

  let maxConsecutive = 1;
  let currentConsecutive = 1;

  for (let i = 1; i < scenarios.length; i++) {
    if (scenarios[i].monthIndex === scenarios[i - 1].monthIndex + 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }

  return maxConsecutive;
}

/**
 * Gets current age from date of birth
 */
function getCurrentAge(state: Store): number {
  const dob = new Date(state.dobISO);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Generates wealth protection recommendations
 */
export function generateWealthProtectionRecommendations(
  scenarios: WealthScenario[],
  state: Store
): string[] {
  const recommendations: string[] = [];

  // Analyze cash flow patterns
  const negativeCashFlowMonths = scenarios.filter(s => s.monthlyIncome < s.monthlyExpenses).length;
  const totalMonths = scenarios.length;

  if (negativeCashFlowMonths / totalMonths > 0.1) {
    recommendations.push('Consider reducing monthly expenses or increasing income');
  }

  // Analyze investment withdrawal patterns
  const monthsWithWithdrawals = scenarios.filter(s => s.investmentWithdrawal > 0).length;
  if (monthsWithWithdrawals > totalMonths * 0.2) {
    recommendations.push('Frequent investment withdrawals detected - review spending patterns');
  }

  // Check emergency fund adequacy
  const maxNegativeWealth = Math.min(...scenarios.map(s => s.netWorth));
  const avgMonthlyExpenses = scenarios.reduce((sum, s) => sum + s.monthlyExpenses, 0) / scenarios.length;
  if (maxNegativeWealth < -avgMonthlyExpenses * 6) {
    recommendations.push('Consider building larger emergency fund (6+ months expenses)');
  }

  return recommendations;
}
