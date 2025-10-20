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
  loadPreset: (presetName: 'worker' | 'investor' | 'businessman' | 'loaner') => void;
  reset: () => void;
  clearAllData: () => void;
};

const CURRENT_VERSION = 1;
const STORAGE_KEY = 'flt-state';

// Demo presets for different character types
const presets = {
  worker: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1990-01-01',
    incomes: [
      {
        id: 'inc-job',
        label: 'Salary',
        amount: 3500,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
    ],
    expenses: [
      { id: 'exp-rent', label: 'Rent', amount: 1200, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-food', label: 'Food & Bills', amount: 800, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-transport', label: 'Transport', amount: 300, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-student',
        label: 'Student Loan',
        principal: 25000,
        monthlyPayment: 200,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 },
        interestRate: 0.045,
        category: 'education',
      },
    ],
    investments: [
      {
        id: 'inv-401k',
        label: '401k',
        principal: 0,
        recurringAmount: 300,
        recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.06 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 25, monthIndex: 25 * 12 }, monthsCoverage: 6, monthlyExpenses: 2300 },
    ],
    retirement: { age: 65, withdrawalRate: 0.04 },
    milestones: [
      { id: 'ms-grad', at: { ageYears: 22, monthIndex: 22 * 12 }, label: 'First Job' },
      { id: 'ms-house', at: { ageYears: 28, monthIndex: 28 * 12 }, label: 'Buy House' },
      { id: 'ms-kids', at: { ageYears: 30, monthIndex: 30 * 12 }, label: 'Start Family' },
      { id: 'ms-promotion', at: { ageYears: 35, monthIndex: 35 * 12 }, label: 'Career Peak' },
      { id: 'ms-retire', at: { ageYears: 65, monthIndex: 65 * 12 }, label: 'Retirement' },
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

  investor: (): CoreState => ({
    version: CURRENT_VERSION,
    dobISO: '1985-01-01',
    incomes: [
      {
        id: 'inc-job',
        label: 'Tech Salary',
        amount: 8000,
        recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
      {
        id: 'inc-dividends',
        label: 'Dividends',
        amount: 500,
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 },
        category: 'investment',
      },
    ],
    expenses: [
      { id: 'exp-mortgage', label: 'Mortgage', amount: 2500, recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 58, monthIndex: 58 * 12 }, everyMonths: 1 } },
      { id: 'exp-living', label: 'Living Costs', amount: 2000, recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-mortgage',
        label: 'Mortgage',
        principal: 400000,
        monthlyPayment: 2500,
        recurrence: { kind: 'recurring', start: { ageYears: 28, monthIndex: 28 * 12 }, end: { ageYears: 58, monthIndex: 58 * 12 }, everyMonths: 1 },
        interestRate: 0.035,
        category: 'mortgage',
      },
    ],
    investments: [
      {
        id: 'inv-index',
        label: 'Index Fund',
        principal: 10000,
        recurringAmount: 2000,
        recurrence: { kind: 'recurring', start: { ageYears: 24, monthIndex: 24 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.08 },
      },
      {
        id: 'inv-stocks',
        label: 'Stock Portfolio',
        principal: 5000,
        recurringAmount: 1000,
        recurrence: { kind: 'recurring', start: { ageYears: 26, monthIndex: 26 * 12 }, end: { ageYears: 50, monthIndex: 50 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.10 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 25, monthIndex: 25 * 12 }, monthsCoverage: 12, monthlyExpenses: 4500 },
    ],
    retirement: { age: 55, withdrawalRate: 0.035 },
    milestones: [
      { id: 'ms-grad', at: { ageYears: 24, monthIndex: 24 * 12 }, label: 'Tech Career' },
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
        label: 'Business Income',
        amount: 15000,
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 60, monthIndex: 60 * 12 }, everyMonths: 1 },
        category: 'business',
      },
      {
        id: 'inc-passive',
        label: 'Passive Income',
        amount: 2000,
        recurrence: { kind: 'recurring', start: { ageYears: 40, monthIndex: 40 * 12 }, everyMonths: 1 },
        category: 'passive',
      },
    ],
    expenses: [
      { id: 'exp-business', label: 'Business Costs', amount: 5000, recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 60, monthIndex: 60 * 12 }, everyMonths: 1 } },
      { id: 'exp-lifestyle', label: 'Lifestyle', amount: 4000, recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
      { id: 'exp-taxes', label: 'Taxes', amount: 3000, recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-business',
        label: 'Business Loan',
        principal: 100000,
        monthlyPayment: 2000,
        recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 45, monthIndex: 45 * 12 }, everyMonths: 1 },
        interestRate: 0.06,
        category: 'business',
      },
    ],
    investments: [
      {
        id: 'inv-real-estate',
        label: 'Real Estate',
        principal: 50000,
        recurringAmount: 3000,
        recurrence: { kind: 'recurring', start: { ageYears: 32, monthIndex: 32 * 12 }, end: { ageYears: 60, monthIndex: 60 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.07 },
      },
      {
        id: 'inv-venture',
        label: 'Venture Capital',
        principal: 20000,
        recurringAmount: 2000,
        recurrence: { kind: 'recurring', start: { ageYears: 35, monthIndex: 35 * 12 }, end: { ageYears: 55, monthIndex: 55 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.12 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Business Reserve', start: { ageYears: 30, monthIndex: 30 * 12 }, monthsCoverage: 18, monthlyExpenses: 12000 },
    ],
    retirement: { age: 60, withdrawalRate: 0.03 },
    milestones: [
      { id: 'ms-startup', at: { ageYears: 30, monthIndex: 30 * 12 }, label: 'Business Start' },
      { id: 'ms-expansion', at: { ageYears: 40, monthIndex: 40 * 12 }, label: 'Expansion' },
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
        amount: 2800,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        category: 'employment',
      },
    ],
    expenses: [
      { id: 'exp-rent', label: 'Rent', amount: 1000, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-loans', label: 'Student Loans', amount: 400, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 } },
      { id: 'exp-living', label: 'Living Costs', amount: 600, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
      { id: 'exp-credit', label: 'Credit Card', amount: 200, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 } },
    ],
    loans: [
      {
        id: 'loan-student',
        label: 'Student Loan',
        principal: 35000,
        monthlyPayment: 400,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 35, monthIndex: 35 * 12 }, everyMonths: 1 },
        interestRate: 0.055,
        category: 'education',
      },
      {
        id: 'loan-credit',
        label: 'Credit Card',
        principal: 5000,
        monthlyPayment: 200,
        recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 30, monthIndex: 30 * 12 }, everyMonths: 1 },
        interestRate: 0.18,
        category: 'credit',
      },
    ],
    investments: [
      {
        id: 'inv-401k',
        label: '401k Match',
        principal: 0,
        recurringAmount: 150,
        recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: 0.06 },
      },
    ],
    safetySavings: [
      { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 30, monthIndex: 30 * 12 }, monthsCoverage: 3, monthlyExpenses: 2200 },
    ],
    retirement: { age: 67, withdrawalRate: 0.04 },
    milestones: [
      { id: 'ms-grad', at: { ageYears: 22, monthIndex: 22 * 12 }, label: 'Graduation' },
      { id: 'ms-job', at: { ageYears: 25, monthIndex: 25 * 12 }, label: 'First Job' },
      { id: 'ms-debt-free', at: { ageYears: 35, monthIndex: 35 * 12 }, label: 'Debt Free' },
      { id: 'ms-house', at: { ageYears: 40, monthIndex: 40 * 12 }, label: 'Buy House' },
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
};

const dummyState = (): CoreState => presets.worker();

function migrateState(persisted: any): CoreState {
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
      addMilestone: (m) => set({ milestones: [...get().milestones, m] }),
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
      loadPreset: (presetName) => set(presets[presetName]()),
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
      migrate: (persisted, version) => migrateState(persisted),
      partialize: (state) => state,
    },
  ),
);


