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

export type SafetySavingsRule = { id: string; label: string; start: AgeMonth; end?: AgeMonth; monthsCoverage: number; monthlyExpenses: number };
export type Retirement = { age: number; withdrawalRate: number };
export type Milestone = { id: string; at: AgeMonth; label: string };

export type InflationConfig = {
  mode: 'single' | 'yearlyTable' | 'imported';
  baseYear: number;
  singleRate?: number;
  yearlyRates?: Record<number, number>;
  importedMeta?: { name: string; rows: number };
  applyTo: { incomes: boolean; expenses: boolean; contributions: boolean; safetySavings: boolean };
  display: { seriesMode: 'nominal' | 'real' };
};

export type CoreState = {
  version: number;
  dobISO: string;
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
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
  removeIncome: (id: string) => void;
  removeExpense: (id: string) => void;
  removeInvestment: (id: string) => void;
  removeSafetySavings: (id: string) => void;
  setZoom: (minMonth: number, maxMonth: number) => void;
  setInflation: (infl: Partial<InflationConfig>) => void;
  setRetirement: (r: Retirement) => void;
  openShare: boolean;
  setOpenShare: (v: boolean) => void;
  reset: () => void;
};

const CURRENT_VERSION = 1;
const STORAGE_KEY = 'flt-state';

const dummyState = (): CoreState => ({
  version: CURRENT_VERSION,
  dobISO: '1990-01-01',
  incomes: [
    {
      id: 'inc-job',
      label: 'Employment Income',
      amount: 4500,
      recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
      category: 'employment',
    },
    {
      id: 'inc-side',
      label: 'Side Business',
      amount: 800,
      recurrence: { kind: 'recurring', start: { ageYears: 30, monthIndex: 30 * 12 }, end: { ageYears: 50, monthIndex: 50 * 12 }, everyMonths: 1 },
      category: 'business',
    },
  ],
  expenses: [
    { id: 'exp-rent', label: 'Housing', amount: 1800, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
    { id: 'exp-food', label: 'Food & Utilities', amount: 600, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
    { id: 'exp-transport', label: 'Transportation', amount: 400, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
    { id: 'exp-healthcare', label: 'Healthcare', amount: 300, recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, everyMonths: 1 } },
  ],
  investments: [
    {
      id: 'inv-index',
      label: 'Index Fund',
      principal: 2000,
      recurringAmount: 800,
      recurrence: { kind: 'recurring', start: { ageYears: 22, monthIndex: 22 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
      model: { type: 'fixed', fixedRate: 0.07 },
    },
    {
      id: 'inv-401k',
      label: '401k Match',
      principal: 0,
      recurringAmount: 400,
      recurrence: { kind: 'recurring', start: { ageYears: 25, monthIndex: 25 * 12 }, end: { ageYears: 65, monthIndex: 65 * 12 }, everyMonths: 1 },
      model: { type: 'fixed', fixedRate: 0.065 },
    },
  ],
  safetySavings: [
    { id: 'ss-1', label: 'Emergency Fund', start: { ageYears: 25, monthIndex: 25 * 12 }, monthsCoverage: 6, monthlyExpenses: 3100 },
    { id: 'ss-2', label: 'Extended Safety', start: { ageYears: 40, monthIndex: 40 * 12 }, monthsCoverage: 12, monthlyExpenses: 3500 },
  ],
  retirement: { age: 65, withdrawalRate: 0.04 },
  milestones: [
    { id: 'ms-grad', at: { ageYears: 22, monthIndex: 22 * 12 }, label: 'Graduation' },
    { id: 'ms-house', at: { ageYears: 28, monthIndex: 28 * 12 }, label: 'First Home' },
    { id: 'ms-kids', at: { ageYears: 32, monthIndex: 32 * 12 }, label: 'Kids' },
    { id: 'ms-retire', at: { ageYears: 65, monthIndex: 65 * 12 }, label: 'Retirement' },
  ],
  inflation: {
    mode: 'single',
    baseYear: new Date().getFullYear(),
    singleRate: 0.025,
    yearlyRates: undefined,
    applyTo: { incomes: true, expenses: true, contributions: true, safetySavings: true },
    display: { seriesMode: 'nominal' },
  },
  chart: { zoom: { minMonth: 0, maxMonth: 100 * 12 } },
});

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
      addMilestone: (m) => set({ milestones: [...get().milestones, m] }),
      removeIncome: (id) => set({ incomes: get().incomes.filter(i => i.id !== id) }),
      removeExpense: (id) => set({ expenses: get().expenses.filter(e => e.id !== id) }),
      removeInvestment: (id) => set({ investments: get().investments.filter(i => i.id !== id) }),
      removeSafetySavings: (id) => set({ safetySavings: get().safetySavings.filter(s => s.id !== id) }),
      setZoom: (minMonth, maxMonth) => set({ chart: { zoom: { minMonth, maxMonth } } }),
      setInflation: (infl) => set({ inflation: { ...get().inflation, ...infl } }),
      setRetirement: (r) => set({ retirement: r }),
      openShare: false,
      setOpenShare: (v) => set({ openShare: v }),
      reset: () => set(dummyState()),
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


