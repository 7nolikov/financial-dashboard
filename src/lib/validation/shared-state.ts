import type {
  AgeMonth,
  CoreState,
  Expense,
  InflationConfig,
  Income,
  Investment,
  Loan,
  Milestone,
  Recurrence,
  Retirement,
  SafetySavingsRule,
} from '../../state/store';

/**
 * Sanitizes state decoded from an untrusted source — currently the share-link
 * URL hash, which anyone can craft. Without this, a malicious link can:
 *   - brick the app: a non-array `incomes`/`expenses`/... makes computeSeries()
 *     throw, and zustand persists the bad state to localStorage, so the crash
 *     survives reload until the victim manually clears storage; or
 *   - freeze the tab: a tiny `inflation.baseYear` (e.g. -1e9) drives the
 *     unbounded `for (y = baseYear; y < calendarYear; y++)` loop in
 *     inflationFactorSinceBase() for ~a billion iterations.
 *
 * Strategy: validate field-by-field, clamp numbers into sane ranges, and drop
 * individual entries that don't match the expected shape rather than rejecting
 * the whole link. Returns only the fields that survived; callers merge these
 * over the current (trusted) state.
 */

const MONTHS = 100 * 12; // timeline horizon used by computeSeries
const MAX_AMOUNT = 1e12; // generous cap on any money figure
const MIN_YEAR = 1900;
const MAX_YEAR = 2200;
const MAX_STR = 200;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Reads a property off an unknown object without tripping index-signature lint. */
function get(v: Record<string, unknown>, key: string): unknown {
  return v[key];
}

function clampNum(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.min(max, Math.max(min, v));
}

/** Clamped finite number, falling back to a default when absent/invalid. */
function numOr(v: unknown, min: number, max: number, fallback: number): number {
  return clampNum(v, min, max) ?? fallback;
}

function cleanStr(v: unknown, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, MAX_STR);
}

function sanitizeAgeMonth(v: unknown): AgeMonth | null {
  if (!isObj(v)) return null;
  const monthIndex = clampNum(get(v, 'monthIndex'), 0, MONTHS);
  if (monthIndex === null) return null;
  const ageYears = numOr(get(v, 'ageYears'), 0, 100, Math.floor(monthIndex / 12));
  return { ageYears, monthIndex: Math.floor(monthIndex) };
}

function sanitizeRecurrence(v: unknown): Recurrence | null {
  if (!isObj(v)) return null;
  const kind = get(v, 'kind');
  if (kind === 'one_time') {
    const at = sanitizeAgeMonth(get(v, 'at'));
    return at ? { kind: 'one_time', at } : null;
  }
  if (kind === 'recurring') {
    const start = sanitizeAgeMonth(get(v, 'start'));
    if (!start) return null;
    const rawEnd = get(v, 'end');
    const end = rawEnd == null ? undefined : (sanitizeAgeMonth(rawEnd) ?? undefined);
    // everyMonths must be a positive integer — 0 would make `% everyMonths`
    // produce NaN and silently drop every contribution.
    const everyMonths = Math.round(numOr(get(v, 'everyMonths'), 1, MONTHS, 1));
    return { kind: 'recurring', start, end, everyMonths };
  }
  return null;
}

function sanitizeRate(v: unknown, fallback = 0): number {
  // Rates are fractions (0.05 = 5%). Cap well beyond any realistic value while
  // keeping the inflation/loan math bounded.
  return numOr(v, -10, 10, fallback);
}

function sanitizeYearlyRates(v: unknown): Record<number, number> | undefined {
  if (!isObj(v)) return undefined;
  const out: Record<number, number> = {};
  for (const [k, val] of Object.entries(v)) {
    const year = clampNum(Number(k), MIN_YEAR, MAX_YEAR);
    if (year === null || !Number.isInteger(year)) continue;
    out[year] = sanitizeRate(val);
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeIncomeLike<T extends Income | Expense>(v: unknown): T | null {
  if (!isObj(v)) return null;
  const recurrence = sanitizeRecurrence(get(v, 'recurrence'));
  if (!recurrence) return null;
  const category = get(v, 'category');
  return {
    id: cleanStr(get(v, 'id')) || crypto.randomUUID(),
    label: cleanStr(get(v, 'label'), 'Untitled'),
    amount: numOr(get(v, 'amount'), -MAX_AMOUNT, MAX_AMOUNT, 0),
    recurrence,
    ...(typeof category === 'string' ? { category: cleanStr(category) } : {}),
  } as T;
}

function sanitizeInvestment(v: unknown): Investment | null {
  if (!isObj(v)) return null;
  const recurrence = sanitizeRecurrence(get(v, 'recurrence'));
  if (!recurrence) return null;
  const modelRaw = get(v, 'model');
  const model = isObj(modelRaw) ? modelRaw : {};
  const type =
    get(model as Record<string, unknown>, 'type') === 'yearlyTable' ? 'yearlyTable' : 'fixed';
  const fixedRate = get(model as Record<string, unknown>, 'fixedRate');
  const yearlyRates = sanitizeYearlyRates(get(model as Record<string, unknown>, 'yearlyRates'));
  const recurringAmount = get(v, 'recurringAmount');
  return {
    id: cleanStr(get(v, 'id')) || crypto.randomUUID(),
    label: cleanStr(get(v, 'label'), 'Investment'),
    principal: numOr(get(v, 'principal'), -MAX_AMOUNT, MAX_AMOUNT, 0),
    ...(recurringAmount == null
      ? {}
      : { recurringAmount: numOr(recurringAmount, -MAX_AMOUNT, MAX_AMOUNT, 0) }),
    recurrence,
    model: {
      type,
      ...(fixedRate == null ? {} : { fixedRate: sanitizeRate(fixedRate) }),
      ...(yearlyRates ? { yearlyRates } : {}),
    },
  };
}

function sanitizeLoan(v: unknown): Loan | null {
  if (!isObj(v)) return null;
  const recurrence = sanitizeRecurrence(get(v, 'recurrence'));
  if (!recurrence) return null;
  const category = get(v, 'category');
  return {
    id: cleanStr(get(v, 'id')) || crypto.randomUUID(),
    label: cleanStr(get(v, 'label'), 'Loan'),
    principal: numOr(get(v, 'principal'), 0, MAX_AMOUNT, 0),
    monthlyPayment: numOr(get(v, 'monthlyPayment'), 0, MAX_AMOUNT, 0),
    recurrence,
    interestRate: sanitizeRate(get(v, 'interestRate')),
    ...(typeof category === 'string' ? { category: cleanStr(category) } : {}),
  };
}

function sanitizeSafetySavings(v: unknown): SafetySavingsRule | null {
  if (!isObj(v)) return null;
  const start = sanitizeAgeMonth(get(v, 'start'));
  if (!start) return null;
  const rawEnd = get(v, 'end');
  return {
    id: cleanStr(get(v, 'id')) || crypto.randomUUID(),
    label: cleanStr(get(v, 'label'), 'Emergency Fund'),
    start,
    end: rawEnd == null ? undefined : (sanitizeAgeMonth(rawEnd) ?? undefined),
    monthsCoverage: Math.round(numOr(get(v, 'monthsCoverage'), 0, MONTHS, 0)),
    monthlyExpenses: numOr(get(v, 'monthlyExpenses'), 0, MAX_AMOUNT, 0),
  };
}

function sanitizeMilestone(v: unknown): Milestone | null {
  if (!isObj(v)) return null;
  const at = sanitizeAgeMonth(get(v, 'at'));
  if (!at) return null;
  return {
    id: cleanStr(get(v, 'id')) || crypto.randomUUID(),
    at,
    label: cleanStr(get(v, 'label'), 'Milestone'),
  };
}

function sanitizeRetirement(v: unknown): Retirement | undefined {
  if (!isObj(v)) return undefined;
  return {
    age: numOr(get(v, 'age'), 0, 120, 65),
    withdrawalRate: numOr(get(v, 'withdrawalRate'), 0, 1, 0.04),
  };
}

function sanitizeInflation(v: unknown): InflationConfig | undefined {
  if (!isObj(v)) return undefined;
  const rawMode = get(v, 'mode');
  const mode = rawMode === 'yearlyTable' || rawMode === 'imported' ? rawMode : ('single' as const);
  const displayRaw = get(v, 'display');
  const display = isObj(displayRaw) ? displayRaw : {};
  const singleRate = get(v, 'singleRate');
  const importedMetaRaw = get(v, 'importedMeta');
  return {
    mode,
    baseYear: Math.round(numOr(get(v, 'baseYear'), MIN_YEAR, MAX_YEAR, new Date().getFullYear())),
    ...(singleRate == null ? {} : { singleRate: sanitizeRate(singleRate) }),
    yearlyRates: sanitizeYearlyRates(get(v, 'yearlyRates')),
    ...(isObj(importedMetaRaw)
      ? {
          importedMeta: {
            name: cleanStr(get(importedMetaRaw, 'name')),
            rows: Math.round(numOr(get(importedMetaRaw, 'rows'), 0, 1e6, 0)),
          },
        }
      : {}),
    display: { seriesMode: get(display, 'seriesMode') === 'real' ? 'real' : 'nominal' },
  };
}

function sanitizeArray<T>(v: unknown, fn: (item: unknown) => T | null): T[] | undefined {
  if (!Array.isArray(v)) return undefined;
  // Cap entry count so a link can't ship millions of items.
  return v
    .slice(0, 1000)
    .map(fn)
    .filter((x): x is T => x !== null);
}

function isValidDOB(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return false;
  const year = new Date(t).getFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

/**
 * Returns a partial state containing only the fields that passed validation.
 * Fields that are absent or invalid are omitted so the caller keeps its
 * trusted defaults for them. Returns null if the input is not an object.
 */
export function sanitizeSharedState(input: unknown): Partial<CoreState> | null {
  if (!isObj(input)) return null;

  const out: Partial<CoreState> = {};

  const dobISO = get(input, 'dobISO');
  if (isValidDOB(dobISO)) out.dobISO = dobISO;

  const incomes = sanitizeArray<Income>(get(input, 'incomes'), sanitizeIncomeLike);
  if (incomes) out.incomes = incomes;
  const expenses = sanitizeArray<Expense>(get(input, 'expenses'), sanitizeIncomeLike);
  if (expenses) out.expenses = expenses;
  const investments = sanitizeArray<Investment>(get(input, 'investments'), sanitizeInvestment);
  if (investments) out.investments = investments;
  const loans = sanitizeArray<Loan>(get(input, 'loans'), sanitizeLoan);
  if (loans) out.loans = loans;
  const safetySavings = sanitizeArray<SafetySavingsRule>(
    get(input, 'safetySavings'),
    sanitizeSafetySavings,
  );
  if (safetySavings) out.safetySavings = safetySavings;
  const milestones = sanitizeArray<Milestone>(get(input, 'milestones'), sanitizeMilestone);
  if (milestones) out.milestones = milestones;

  if ('retirement' in input) {
    const retirement = sanitizeRetirement(get(input, 'retirement'));
    if (retirement) out.retirement = retirement;
  }

  const inflation = sanitizeInflation(get(input, 'inflation'));
  if (inflation) out.inflation = inflation;

  return out;
}
