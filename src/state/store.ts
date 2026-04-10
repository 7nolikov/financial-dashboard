import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AgeMonth = { ageYears: number; monthIndex: number };

export type Recurrence =
  | { kind: 'one_time'; at: AgeMonth }
  | { kind: 'recurring'; start: AgeMonth; end?: AgeMonth; everyMonths: number };

export type Income = { id: string; label: string; amount: number; recurrence: Recurrence; category?: string };
export type Expense = { id: string; label: string; amount: number; recurrence: Recurrence; category?: string };

export type Investment = {
  id: string;
  label: string;
  principal: number;
  recurringAmount?: number;
  recurrence: Recurrence;
  model: { type: 'fixed' | 'yearlyTable'; fixedRate?: number; yearlyRates?: Record<number, number> };
};

export type Loan = {
  id: string;
  label: string;
  principal: number; // initial loan amount
  monthlyPayment: number; // fixed monthly payment
  recurrence: Recurrence; // when payments start/end
  interestRate: number; // APR
  category?: string; // mortgage, student, car, etc.
};

export type SafetySavingsRule = { id: string; label: string; start: AgeMonth; end?: AgeMonth; monthsCoverage: number; monthlyExpenses: number };
export type Retirement = { age: number; withdrawalRate: number };
export type Milestone = { id: string; at: AgeMonth; label: string };

export type InflationConfig = {
  mode: 'single' | 'yearlyTable' | 'imported';
  baseYear: number;
  singleRate?: number;
  yearlyRates?: Record<number, number>;
  importedMeta?: { name: string; rows: number };
  display: { seriesMode: 'nominal' | 'real' };
};

export type CoreState = {
  version: number;
  dobISO: string;
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  loans: Loan[];
  safetySavings: SafetySavingsRule[];
  retirement?: Retirement;
  milestones: Milestone[];
  inflation: InflationConfig;
  chart: { zoom: { minMonth: number; maxMonth: number } };
};

export type Store = CoreState & {
  setDOB: (iso: string) => void;
  addIncome: (i: Income) => void;
  addExpense: (e: Expense) => void;
  addInvestment: (inv: Investment) => void;
  addLoan: (loan: Loan) => void;
  addMilestone: (m: Milestone) => void;
  removeIncome: (id: string) => void;
  removeExpense: (id: string) => void;
  removeInvestment: (id: string) => void;
  removeLoan: (id: string) => void;
  removeSafetySavings: (id: string) => void;
  setZoom: (minMonth: number, maxMonth: number) => void;
  setInflation: (infl: Partial<InflationConfig>) => void;
  setRetirement: (r: Retirement) => void;
  openShare: boolean;
  setOpenShare: (v: boolean) => void;
  loadPreset: (presetName: 'worker' | 'investor' | 'businessman' | 'loaner' | 'average') => void;
  reset: () => void;
  clearAllData: () => void;
};

const CURRENT_VERSION = 1;
const STORAGE_KEY = 'flt-state';

// Demo presets for different character types with realistic European financial data
const presets = {
  worker: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1990-01-01',
    incomes: [
      {
        id: 'inc-job',
        label: 'Salary',
        amount: 2800, // ~€33.6k annually, realistic for 22-year-old graduate in Western Europe
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 28, monthIndex: 28 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-raise-1',
        label: 'Salary (Promotion)',
        amount: 3800, // ~€45.6k annually, realistic for late 20s
        recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-raise-2',
        label: 'Salary (Senior)',
        amount: 5200, // ~€62.4k annually, realistic for mid-30s specialist
        recurrence: { kind: 'recurring', start: { ageYears: 35, monthIndex: 35 * 12 }, end: { ageYears: 50, monthIndex: 50 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-raise-3',
        label: 'Salary (Manager)',
        amount: 6500, // ~€78k annually, realistic for late career management
        recurrence: { kind: 'recurring', start: { ageYears: 50, monthIndex: 50 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
    ],
    expenses: [
      { id: 'exp-rent', label: 'Rent/Housing', amount: 1100, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-food', label: 'Food & Groceries', amount: 450, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-transport', label: 'Transportation', amount: 200, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-insurance', label: 'Health Insurance', amount: 120, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-utilities', label: 'Utilities', amount: 180, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-misc', label: 'Miscellaneous', amount: 250, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-student',
        label: 'Student Loan',
        principal: 10000, // European subsidised education — much smaller than US
        monthlyPayment: 120,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 },
        interestRate: 0.02, // Low EU government student loan rate
        category: 'education',
      },
    ],
    investments: [
      {
        id: 'inv-pension',
        label: 'Occupational Pension (employer match)',
        principal: 0,
        recurringAmount: 280, // ~10% of €2,800 salary — employer-matched European pension
        recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.06 },
      },
      {
        id: 'inv-etf',
        label: 'MSCI World ETF',
        principal: 0,
        recurringAmount: 350, // Monthly ETF investment via broker (e.g. Degiro, IBKR)
        recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.075 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 25, monthIndex: 25 * 12 }, monthsCoverage: 6, monthlyExpenses: 2300 },
    ],
    retirement: { age: 65, withdrawalRate: 0.04 }, // 4% annual withdrawal rate
    milestones: [
      { id: 'ms-grad', at: { ageYears: 22, monthIndex: 22 * 12 }, label: 'First Job' },
      { id: 'ms-promotion', at: { ageYears: 28, monthIndex: 28 * 12 }, label: 'First Promotion' },
      { id: 'ms-house', at: { ageYears: 32, monthIndex: 32 * 12 }, label: 'Buy Apartment' },
      { id: 'ms-kids', at: { ageYears: 30, monthIndex: 30 * 12 }, label: 'Start Family' },
      { id: 'ms-senior', at: { ageYears: 35, monthIndex: 35 * 12 }, label: 'Senior Role' },
      { id: 'ms-manager', at: { ageYears: 50, monthIndex: 50 * 12 }, label: 'Management Role' },
      { id: 'ms-retire', at: { ageYears: 65, monthIndex: 65 * 12 }, label: 'Retirement' },
    ],
    inflation: {
      mode: 'single',
      baseYear: new Date().getFullYear(),
      singleRate: 0.025, // ECB target ~2%; 2.5% accounts for realistic medium-term average
      yearlyRates: undefined,
      display: { seriesMode: 'nominal' },
    },
    chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
  }),

  investor: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1985-01-01',
    incomes: [
      {
        id: 'inc-job',
        label: 'Tech Salary',
        amount: 8500, // ~€102k annually, realistic for senior tech in Amsterdam/Berlin/Paris
        recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-bonus',
        label: 'Annual Bonus',
        amount: 1800, // ~€21.6k annually
        recurrence: { kind: 'recurring', start: { ageYears: 26, monthIndex: 26 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 12 },
        category: 'employment',
      },
      {
        id: 'inc-dividends',
        label: 'Dividend Income',
        amount: 650, // Growing dividend portfolio
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 },
        category: 'investment',
      },
    ],
    expenses: [
      { id: 'exp-mortgage', label: 'Mortgage', amount: 1800, recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 58, monthIndex: 58 * 12 }, everyMonths: 1 } },
      { id: 'exp-living', label: 'Living Costs', amount: 2200, recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, everyMonths: 1 } },
      { id: 'exp-taxes', label: 'Income Tax', amount: 1800, recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-mortgage',
        label: 'Mortgage',
        principal: 350000, // Realistic European city apartment/house price
        monthlyPayment: 1800,
        recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 58, monthIndex: 58 * 12 }, everyMonths: 1 },
        interestRate: 0.035, // European mortgage rate (fixed 10-year)
        category: 'mortgage',
      },
    ],
    investments: [
      {
        id: 'inv-index',
        label: 'MSCI World ETF',
        principal: 12000,
        recurringAmount: 1800, // ~21% of salary — disciplined European investor
        recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.075 },
      },
      {
        id: 'inv-stocks',
        label: 'European Stock Portfolio',
        principal: 6000,
        recurringAmount: 900,
        recurrence: { kind: 'recurring', start: { ageYears: 26, monthIndex: 26 * 12 }, end: { ageYears: 50, monthIndex: 50 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.09 },
      },
      {
        id: 'inv-pension',
        label: 'Occupational Pension (max)',
        principal: 0,
        recurringAmount: 1500, // Max occupational pension contribution
        recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.06 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 25, monthIndex: 25 * 12 }, monthsCoverage: 12, monthlyExpenses: 6000 },
    ],
    retirement: { age: 55, withdrawalRate: 0.04 }, // Early retirement at 55 with 4% withdrawal
    milestones: [
      { id: 'ms-grad', at: { ageYears: 24, monthIndex: 24 * 12 }, label: 'Tech Career Start' },
      { id: 'ms-house', at: { ageYears: 28, monthIndex: 28 * 12 }, label: 'First Home' },
      { id: 'ms-invest', at: { ageYears: 32, monthIndex: 32 * 12 }, label: 'Major Investment' },
      { id: 'ms-retire', at: { ageYears: 55, monthIndex: 55 * 12 }, label: 'Early Retirement' },
    ],
    inflation: {
      mode: 'single',
      baseYear: new Date().getFullYear(),
      singleRate: 0.025,
      yearlyRates: undefined,
      display: { seriesMode: 'nominal' },
    },
    chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
  }),

  businessman: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1980-01-01',
    incomes: [
      {
        id: 'inc-business',
        label: 'Business Revenue',
        amount: 10000, // ~€120k annually, realistic for European SME owner
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 60, monthIndex: 60 * 12 }, everyMonths: 1 },
        category: 'business',
      },
      {
        id: 'inc-passive',
        label: 'Rental Income',
        amount: 1200, // Rental property income, common European wealth vehicle
        recurrence: { kind: 'recurring', start: { ageYears: 40, monthIndex: 40 * 12 }, everyMonths: 1 },
        category: 'passive',
      },
    ],
    expenses: [
      { id: 'exp-business', label: 'Business Expenses', amount: 3500, recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 60, monthIndex: 60 * 12 }, everyMonths: 1 } },
      { id: 'exp-lifestyle', label: 'Personal Lifestyle', amount: 2800, recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
      { id: 'exp-taxes', label: 'Business Taxes & VAT', amount: 2000, recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-business',
        label: 'Business Loan',
        principal: 60000, // European SME loan — ECB-backed lending
        monthlyPayment: 1400,
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 45, monthIndex: 45 * 12 }, everyMonths: 1 },
        interestRate: 0.045, // European SME lending rate
        category: 'business',
      },
    ],
    investments: [
      {
        id: 'inv-real-estate',
        label: 'Real Estate Portfolio',
        principal: 40000,
        recurringAmount: 1200,
        recurrence: { kind: 'recurring', start: { ageYears: 32, monthIndex: 32 * 12 }, end: { ageYears: 60, monthIndex: 60 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.065 },
      },
      {
        id: 'inv-growth',
        label: 'Growth ETF (MSCI World)',
        principal: 15000,
        recurringAmount: 800,
        recurrence: { kind: 'recurring', start: { ageYears: 35, monthIndex: 35 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.10 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Business Reserve', start: { ageYears: 30, monthIndex: 30 * 12 }, monthsCoverage: 12, monthlyExpenses: 8300 },
    ],
    retirement: { age: 60, withdrawalRate: 0.04 }, // 4% annual withdrawal rate
    milestones: [
      { id: 'ms-startup', at: { ageYears: 30, monthIndex: 30 * 12 }, label: 'Business Launch' },
      { id: 'ms-expansion', at: { ageYears: 40, monthIndex: 40 * 12 }, label: 'Business Expansion' },
      { id: 'ms-success', at: { ageYears: 50, monthIndex: 50 * 12 }, label: 'Business Success' },
      { id: 'ms-retire', at: { ageYears: 60, monthIndex: 60 * 12 }, label: 'Retirement' },
    ],
    inflation: {
      mode: 'single',
      baseYear: new Date().getFullYear(),
      singleRate: 0.025,
      yearlyRates: undefined,
      display: { seriesMode: 'nominal' },
    },
    chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
  }),

  loaner: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1995-01-01',
    incomes: [
      {
        id: 'inc-job',
        label: 'Entry Salary',
        amount: 2500, // ~€30k annually, realistic for entry level in Europe
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-raise',
        label: 'Salary Increase',
        amount: 3400, // ~€40.8k annually, after gaining experience
        recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
    ],
    expenses: [
      { id: 'exp-rent', label: 'Rent (shared flat)', amount: 950, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-loans', label: 'Student Loan Payment', amount: 150, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
      { id: 'exp-living', label: 'Living Costs', amount: 650, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-credit', label: 'Credit Card Payment', amount: 200, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-student',
        label: 'Student Loan',
        principal: 12000, // European student loan — subsidised, much smaller than US
        monthlyPayment: 150,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 },
        interestRate: 0.03, // Low EU government student loan rate
        category: 'education',
      },
      {
        id: 'loan-credit',
        label: 'Credit Card Debt',
        principal: 5000,
        monthlyPayment: 200,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 },
        interestRate: 0.18, // European credit card APR
        category: 'credit',
      },
    ],
    investments: [
      {
        id: 'inv-pension',
        label: 'Pension Fund (minimal)',
        principal: 0,
        recurringAmount: 125, // Only 5% of salary — barely contributing
        recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.05 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 30, monthIndex: 30 * 12 }, monthsCoverage: 3, monthlyExpenses: 1800 },
    ],
    retirement: { age: 67, withdrawalRate: 0.04 },
    milestones: [
      { id: 'ms-grad', at: { ageYears: 22, monthIndex: 22 * 12 }, label: 'Graduation' },
      { id: 'ms-job', at: { ageYears: 25, monthIndex: 25 * 12 }, label: 'First Job' },
      { id: 'ms-debt-free', at: { ageYears: 30, monthIndex: 30 * 12 }, label: 'Debt Free' },
      { id: 'ms-house', at: { ageYears: 40, monthIndex: 40 * 12 }, label: 'Buy Apartment' },
      { id: 'ms-retire', at: { ageYears: 67, monthIndex: 67 * 12 }, label: 'Retirement' },
    ],
    inflation: {
      mode: 'single',
      baseYear: new Date().getFullYear(),
      singleRate: 0.025,
      yearlyRates: undefined,
      display: { seriesMode: 'nominal' },
    },
    chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
  }),

  // "Average European" — wake-up call preset based on real EU median stats.
  // Median household income, low savings rate (~5%), minimal pension savings at 41.
  // The chart will show a stark retirement gap — that's the point.
  average: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1985-01-01', // age ~41
    incomes: [
      {
        id: 'inc-job',
        label: 'Median Household Income',
        amount: 3500, // ~€42k/yr — Western/Central Europe median gross household income
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 67, monthIndex: 67 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-ss',
        label: 'State Pension (est.)',
        amount: 1400, // avg European state pension benefit ~€1,400/mo
        recurrence: { kind: 'recurring', start: { ageYears: 67, monthIndex: 67 * 12 }, everyMonths: 1 },
        category: 'government',
      },
    ],
    expenses: [
      { id: 'exp-housing', label: 'Rent / Mortgage', amount: 1100, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-food', label: 'Food & Groceries', amount: 550, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-transport', label: 'Transportation', amount: 350, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-healthcare', label: 'Healthcare Co-pays', amount: 150, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-utilities', label: 'Utilities & Phone', amount: 250, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-entertainment', label: 'Entertainment & Dining', amount: 300, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-misc', label: 'Miscellaneous', amount: 280, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-car',
        label: 'Car Loan',
        principal: 18000, // Typical European car finance
        monthlyPayment: 350,
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 },
        interestRate: 0.055, // European auto loan rate
        category: 'auto',
      },
    ],
    investments: [
      {
        id: 'inv-pension',
        label: 'Pension Fund (5% savings rate)',
        principal: 22000, // Typical European pension pot around age 41 for low savers
        recurringAmount: 175, // 5% of €3,500 — the "average European" barely saves beyond state pension
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 67, monthIndex: 67 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.06 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 30, monthIndex: 30 * 12 }, monthsCoverage: 1, monthlyExpenses: 2980 },
    ],
    retirement: { age: 67, withdrawalRate: 0.04 },
    milestones: [
      { id: 'ms-job', at: { ageYears: 22, monthIndex: 22 * 12 }, label: 'Started Working' },
      { id: 'ms-retire', at: { ageYears: 67, monthIndex: 67 * 12 }, label: 'Retirement' },
    ],
    inflation: {
      mode: 'single',
      baseYear: new Date().getFullYear(),
      singleRate: 0.025, // ECB target ~2%; 2.5% accounts for realistic medium-term average
      yearlyRates: undefined,
      display: { seriesMode: 'nominal' },
    },
    chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
  }),
};

const dummyState = (): CoreState => presets.worker();

function migrateState(persisted: unknown): CoreState {
  if (!persisted || typeof persisted !== 'object') return dummyState();
  // Add future migrations here based on persisted.version
  return { ...dummyState(), ...persisted, version: CURRENT_VERSION } as CoreState;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...dummyState(),
      setDOB: (iso) => set({ dobISO: iso }),
      addIncome: (i) => set({ incomes: [...get().incomes, i] }),
      addExpense: (e) => set({ expenses: [...get().expenses, e] }),
      addInvestment: (inv) => set({ investments: [...get().investments, inv] }),
      addLoan: (loan) => set({ loans: [...get().loans, loan] }),
      addMilestone: (m: Milestone) => set({ milestones: [...get().milestones, m] }),
      removeIncome: (id) => set({ incomes: get().incomes.filter(i => i.id !== id) }),
      removeExpense: (id) => set({ expenses: get().expenses.filter(e => e.id !== id) }),
      removeInvestment: (id) => set({ investments: get().investments.filter(i => i.id !== id) }),
      removeLoan: (id) => set({ loans: get().loans.filter(l => l.id !== id) }),
      removeSafetySavings: (id) => set({ safetySavings: get().safetySavings.filter(s => s.id !== id) }),
      setZoom: (minMonth, maxMonth) => set({ chart: { zoom: { minMonth, maxMonth } } }),
      setInflation: (infl) => set({ inflation: { ...get().inflation, ...infl } }),
      setRetirement: (r) => set({ retirement: r }),
      openShare: false,
      setOpenShare: (v) => set({ openShare: v }),
      loadPreset: (presetName) => set(presets[presetName as keyof typeof presets]()),
      reset: () => set(presets.worker()),
      clearAllData: () => set({
        ...presets.worker(),
        incomes: [],
        expenses: [],
        investments: [],
        loans: [],
        safetySavings: [],
        milestones: [],
      }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      migrate: (persisted, _version) => migrateState(persisted),
      // Persist only financial data — exclude UI-only fields (zoom, openShare)
      // so that zooming and opening modals does NOT write to localStorage.
      partialize: ({ version, dobISO, incomes, expenses, investments, loans, safetySavings, retirement, milestones, inflation }) =>
        ({ version, dobISO, incomes, expenses, investments, loans, safetySavings, retirement, milestones, inflation }),
    },
  ),
);


