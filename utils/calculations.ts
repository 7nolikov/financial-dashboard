import type { FinancialData, UserSettings, TimeRange, FinancialSummaryData } from "../types"

// Define the FinancialEntry type
interface FinancialEntry {
  startAge: number
  endAge: number | null
  amount: number
  recurring: boolean
}

// Optimize the calculateFinancials function
export function calculateFinancials(
  financialData: FinancialData,
  settings: UserSettings,
  timeRange: TimeRange,
): FinancialSummaryData {
  // Initialize values
  let totalIncome = 0
  let totalExpenses = 0
  let totalInvestments = 0
  let netWorth = 0

  // Previous period for growth calculation
  let prevTotalIncome = 0
  let prevTotalExpenses = 0
  let prevTotalInvestments = 0
  let prevNetWorth = 0

  // Calculate current period values
  financialData.income.forEach((income) => {
    if (isInTimeRange(income, timeRange)) {
      totalIncome += calculateAmountInRange(income, timeRange)
    }

    // Calculate for previous period
    const prevTimeRange = {
      start: Math.max(0, timeRange.start - (timeRange.end - timeRange.start)),
      end: timeRange.start - 1,
    }

    if (isInTimeRange(income, prevTimeRange)) {
      prevTotalIncome += calculateAmountInRange(income, prevTimeRange)
    }
  })

  financialData.expenses.forEach((expense) => {
    if (isInTimeRange(expense, timeRange)) {
      totalExpenses += calculateAmountInRange(expense, timeRange)
    }

    // Calculate for previous period
    const prevTimeRange = {
      start: Math.max(0, timeRange.start - (timeRange.end - timeRange.start)),
      end: timeRange.start - 1,
    }

    if (isInTimeRange(expense, prevTimeRange)) {
      prevTotalExpenses += calculateAmountInRange(expense, prevTimeRange)
    }
  })

  // Simplified investment calculation
  financialData.investments.forEach((investment) => {
    if (isInTimeRange(investment, timeRange)) {
      const amount = calculateAmountInRange(investment, timeRange)
      totalInvestments += amount

      // Apply a simplified compound interest calculation
      if (settings.interestRateType === "fixed") {
        const years = timeRange.end - Math.max(investment.startAge, timeRange.start) + 1
        if (years > 1) {
          totalInvestments += (amount * settings.interestRate * (years - 1)) / 2
        }
      }
    }

    // Calculate for previous period
    const prevTimeRange = {
      start: Math.max(0, timeRange.start - (timeRange.end - timeRange.start)),
      end: timeRange.start - 1,
    }

    if (isInTimeRange(investment, prevTimeRange)) {
      prevTotalInvestments += calculateAmountInRange(investment, prevTimeRange)
    }
  })

  // Calculate net worth
  netWorth = totalIncome - totalExpenses + totalInvestments
  prevNetWorth = prevTotalIncome - prevTotalExpenses + prevTotalInvestments

  // Calculate growth percentages
  const incomeGrowth = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
  const expensesGrowth = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0
  const investmentsGrowth =
    prevTotalInvestments > 0 ? ((totalInvestments - prevTotalInvestments) / prevTotalInvestments) * 100 : 0
  const netWorthGrowth = prevNetWorth > 0 ? ((netWorth - prevNetWorth) / prevNetWorth) * 100 : 0

  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    netWorth,
    incomeGrowth,
    expensesGrowth,
    investmentsGrowth,
    netWorthGrowth,
  }
}

// Helper functions
function isInTimeRange(entry: FinancialEntry, timeRange: TimeRange): boolean {
  return entry.startAge <= timeRange.end && (entry.endAge === null || entry.endAge >= timeRange.start)
}

function calculateAmountInRange(entry: FinancialEntry, timeRange: TimeRange): number {
  if (!entry.recurring) {
    return entry.startAge >= timeRange.start && entry.startAge <= timeRange.end ? entry.amount : 0
  }

  const yearsInRange = calculateYearsInRange(entry.startAge, entry.endAge, timeRange.start, timeRange.end)

  return entry.amount * yearsInRange
}

function calculateYearsInRange(startAge: number, endAge: number | null, rangeStart: number, rangeEnd: number): number {
  const effectiveStart = Math.max(startAge, rangeStart)
  const effectiveEnd = endAge === null ? rangeEnd : Math.min(endAge, rangeEnd)

  return Math.max(0, effectiveEnd - effectiveStart + 1)
}

