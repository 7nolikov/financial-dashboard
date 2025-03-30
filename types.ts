export interface FinancialEntry {
  id: number
  name: string
  amount: number
  startAge: number
  endAge: number | null
  recurring: boolean
}

export interface FinancialData {
  income: FinancialEntry[]
  expenses: FinancialEntry[]
  investments: FinancialEntry[]
}

export interface TimeRange {
  start: number
  end: number
}

export interface SafetySavingsConfig {
  ageRange: [number, number]
  amount: number
}

export interface UserSettings {
  safetySavings: SafetySavingsConfig[]
  interestRateType: "fixed" | "api" | "yearly"
  interestRate: number
  yearlyInterestRates: number[]
  retirementAge: number
  retirementWithdrawalRate: number
}

export interface Milestone {
  id: number
  year: number
  label: string
}

export interface FinancialSummaryData {
  totalIncome: number
  totalExpenses: number
  totalInvestments: number
  netWorth: number
  incomeGrowth: number
  expensesGrowth: number
  investmentsGrowth: number
  netWorthGrowth: number
}

