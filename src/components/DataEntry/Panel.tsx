import React from 'react';
import { useStore, Income, Expense, Investment } from '../../state/store';

function uid(prefix: string) { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }

export function DataEntryPanel() {
  const [tab, setTab] = React.useState<'income' | 'expense' | 'investment' | 'retirement'>('income');
  const loadPreset = useStore((s) => s.loadPreset);
  const clearAllData = useStore((s) => s.clearAllData);
  const [confirmClear, setConfirmClear] = React.useState(false);

  function handleClearAll() {
    if (confirmClear) {
      clearAllData();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 sm:px-6 py-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Financial Data Entry</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Add and manage your financial information</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs sm:text-sm font-medium text-slate-700">Demo Presets:</label>
            <div className="flex gap-2">
              <select
                onChange={(e) => e.target.value && loadPreset(e.target.value as 'worker' | 'investor' | 'businessman' | 'loaner' | 'average')}
                className="flex-1 sm:min-w-[160px] border border-slate-300 px-3 py-2 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                defaultValue="worker"
              >
                <option value="worker">👷 Worker</option>
                <option value="investor">📈 Investor</option>
                <option value="businessman">💼 Businessman</option>
                <option value="loaner">🎓 Loaner</option>
                <option value="average">😰 Average American</option>
              </select>
              <button
                onClick={handleClearAll}
                className={`px-3 sm:px-4 py-2 border rounded-lg transition-all text-xs sm:text-sm font-medium whitespace-nowrap ${
                  confirmClear
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                }`}
                title={confirmClear ? 'Click again to confirm — this cannot be undone' : 'Clear all data and start from scratch'}
              >
                {confirmClear ? '⚠️ Confirm Clear?' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="flex flex-wrap gap-1 p-2">
          <TabButton active={tab === 'income'} onClick={() => setTab('income')} title="Add monthly pay or other income">
            <span className="hidden sm:inline">💰 Income</span>
            <span className="sm:hidden">💰</span>
          </TabButton>
          <TabButton active={tab === 'expense'} onClick={() => setTab('expense')} title="Add bills and other costs">
            <span className="hidden sm:inline">💸 Expenses</span>
            <span className="sm:hidden">💸</span>
          </TabButton>
          <TabButton active={tab === 'investment'} onClick={() => setTab('investment')} title="Add investment contributions and rates">
            <span className="hidden sm:inline">📈 Investments</span>
            <span className="sm:hidden">📈</span>
          </TabButton>
          <TabButton active={tab === 'retirement'} onClick={() => setTab('retirement')} title="Set retirement age and withdrawal %">
            <span className="hidden sm:inline">🏖️ Retirement</span>
            <span className="sm:hidden">🏖️</span>
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          {tab === 'income' && <IncomeTab />}
          {tab === 'expense' && <ExpenseTab />}
          {tab === 'investment' && <InvestmentTab />}
          {tab === 'retirement' && <RetirementTab />}
        </div>
      </div>
    </div>
  );
}

function TabButton(props: React.PropsWithChildren<{ active: boolean; onClick: () => void; title?: string }>) {
  return (
    <button
      onClick={props.onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        props.active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-300'
      }`}
      title={props.title}
    >
      {props.children}
    </button>
  );
}

function FormCard({ icon, title, subtitle, color, children }: React.PropsWithChildren<{ icon: string; title: string; subtitle: string; color: string }>) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-800 text-red-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 text-emerald-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-800 text-violet-700',
  };
  const [bg, border, titleColor, subtitleColor] = colorMap[color]?.split(' ') ?? ['bg-slate-50', 'border-slate-200', 'text-slate-800', 'text-slate-700'];
  return (
    <div className={`${bg} rounded-xl p-4 border ${border}`}>
      <h3 className={`text-lg font-semibold ${titleColor} mb-1 flex items-center gap-2`}>
        <span className="text-xl">{icon}</span>
        {title}
      </h3>
      <p className={`text-sm ${subtitleColor} mb-4`}>{subtitle}</p>
      {children}
    </div>
  );
}

function IncomeTab() {
  const incomes = useStore((s) => s.incomes);
  const addIncome = useStore((s) => s.addIncome);
  const removeIncome = useStore((s) => s.removeIncome);
  const [label, setLabel] = React.useState('New Income');
  const [amount, setAmount] = React.useState(1000);
  const [startAge, setStartAge] = React.useState(22);
  const [endAge, setEndAge] = React.useState<number | ''>('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    if (!label.trim() || amount <= 0 || startAge < 0 || startAge > 100) return;
    setIsAdding(true);
    try {
      const inc: Income = {
        id: uid('inc'), label, amount,
        recurrence: { kind: 'recurring', start: { ageYears: startAge, monthIndex: startAge * 12 }, end: endAge === '' ? undefined : { ageYears: Number(endAge), monthIndex: Number(endAge) * 12 }, everyMonths: 1 },
      };
      addIncome(inc);
      setLabel('New Income');
      setAmount(1000);
      setStartAge(22);
      setEndAge('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormCard icon="💰" title="Add Income Source" subtitle="Add monthly income sources (salary, freelance, dividends, etc.)" color="blue">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Label</label>
            <input className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="e.g., Salary" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Monthly Amount ($)</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="3500" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Start Age</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="22" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">End Age (optional)</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="65" min="0" max="100" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${isAdding ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm'}`}
            disabled={isAdding}
            onClick={handleAdd}
          >
            {isAdding ? 'Adding...' : 'Add Income'}
          </button>
        </div>
      </FormCard>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Current Income Sources ({incomes.length})
        </h4>
        <ItemList
          items={incomes}
          icon="💰"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          renderLabel={(i) => i.label}
          renderDetail={(i) => `$${i.amount.toLocaleString()}/month`}
          onRemove={(i) => removeIncome(i.id)}
          emptyIcon="📊"
          emptyText="No income sources added yet"
          emptyHint="Add your first income source above"
        />
      </div>
    </div>
  );
}

function ExpenseTab() {
  const expenses = useStore((s) => s.expenses);
  const addExpense = useStore((s) => s.addExpense);
  const removeExpense = useStore((s) => s.removeExpense);
  const [label, setLabel] = React.useState('New Expense');
  const [amount, setAmount] = React.useState(500);
  const [startAge, setStartAge] = React.useState(22);
  const [endAge, setEndAge] = React.useState<number | ''>('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    if (!label.trim() || amount <= 0 || startAge < 0 || startAge > 100) return;
    setIsAdding(true);
    try {
      const exp: Expense = {
        id: uid('exp'), label, amount,
        recurrence: { kind: 'recurring', start: { ageYears: startAge, monthIndex: startAge * 12 }, end: endAge === '' ? undefined : { ageYears: Number(endAge), monthIndex: Number(endAge) * 12 }, everyMonths: 1 },
      };
      addExpense(exp);
      setLabel('New Expense');
      setAmount(500);
      setStartAge(22);
      setEndAge('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormCard icon="💸" title="Add Expense" subtitle="Add monthly expenses (rent, utilities, groceries, etc.)" color="red">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Label</label>
            <input className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="e.g., Rent" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Monthly Amount ($)</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="1200" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Start Age</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="22" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">End Age (optional)</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="65" min="0" max="100" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${isAdding ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm'}`}
            disabled={isAdding}
            onClick={handleAdd}
          >
            {isAdding ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </FormCard>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Current Expenses ({expenses.length})
        </h4>
        <ItemList
          items={expenses}
          icon="💸"
          iconBg="bg-red-100"
          iconColor="text-red-600"
          renderLabel={(e) => e.label}
          renderDetail={(e) => `$${e.amount.toLocaleString()}/month`}
          onRemove={(e) => removeExpense(e.id)}
          emptyIcon="💸"
          emptyText="No expenses added yet"
          emptyHint="Add your first expense above"
        />
      </div>
    </div>
  );
}

function InvestmentTab() {
  const investments = useStore((s) => s.investments);
  const addInvestment = useStore((s) => s.addInvestment);
  const removeInvestment = useStore((s) => s.removeInvestment);
  const [label, setLabel] = React.useState('New Investment');
  const [recurringAmount, setRecurringAmount] = React.useState(500);
  const [fixedRate, setFixedRate] = React.useState(6.5);
  const [startAge, setStartAge] = React.useState(22);
  const [endAge, setEndAge] = React.useState<number | ''>(65);
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    if (!label.trim() || recurringAmount <= 0 || fixedRate < 0 || startAge < 0 || startAge > 100) return;
    setIsAdding(true);
    try {
      const inv: Investment = {
        id: uid('inv'), label, principal: 0, recurringAmount,
        recurrence: { kind: 'recurring', start: { ageYears: startAge, monthIndex: startAge * 12 }, end: endAge === '' ? undefined : { ageYears: Number(endAge), monthIndex: Number(endAge) * 12 }, everyMonths: 1 },
        model: { type: 'fixed', fixedRate: fixedRate / 100 },
      };
      addInvestment(inv);
      setLabel('New Investment');
      setRecurringAmount(500);
      setFixedRate(6.5);
      setStartAge(22);
      setEndAge(65);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormCard icon="📈" title="Add Investment" subtitle="Add monthly investment contributions (401k, IRA, index funds, etc.)" color="emerald">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Label</label>
            <input className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="e.g., 401k" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Monthly Contribution ($)</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="500" min="0" value={recurringAmount} onChange={(e) => setRecurringAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Expected APR %</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" step="0.1" min="0" max="50" placeholder="6.5" value={fixedRate} onChange={(e) => setFixedRate(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Start Age</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="22" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">End Age</label>
            <input type="number" className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="65" min="0" max="100" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${isAdding ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm'}`}
            disabled={isAdding}
            onClick={handleAdd}
          >
            {isAdding ? 'Adding...' : 'Add Investment'}
          </button>
        </div>
      </FormCard>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Current Investments ({investments.length})
        </h4>
        <ItemList
          items={investments}
          icon="📈"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          renderLabel={(i) => i.label}
          renderDetail={(i) => `$${(i.recurringAmount ?? 0).toLocaleString()}/mo @ ${((i.model.fixedRate ?? 0) * 100).toFixed(1)}% APR`}
          onRemove={(i) => removeInvestment(i.id)}
          emptyIcon="📈"
          emptyText="No investments added yet"
          emptyHint="Add your first investment above"
        />
      </div>
    </div>
  );
}

function RetirementTab() {
  const r = useStore((s) => s.retirement);
  const setR = useStore((s) => s.setRetirement);
  const [age, setAge] = React.useState(r?.age ?? 65);
  const [rate, setRate] = React.useState(r?.withdrawalRate ? r.withdrawalRate * 100 : 4);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (age < 50 || age > 100 || rate < 0 || rate > 20) return;
    setIsSaving(true);
    try {
      setR({ age, withdrawalRate: rate / 100 });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormCard icon="🏖️" title="Retirement Settings" subtitle="Configure your target retirement age and annual portfolio withdrawal rate" color="violet">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Retirement Age</label>
            <input
              type="number"
              className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
              min="50"
              max="100"
              placeholder="65"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">Employment income stops at this age</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Annual Withdrawal Rate (%)</label>
            <input
              type="number"
              className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
              step="0.1"
              min="0"
              max="20"
              placeholder="4.0"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">% of portfolio withdrawn each year</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-violet-100 rounded-lg border border-violet-200">
          <p className="text-xs text-violet-800 font-medium">
            💡 Common rates: <strong>3–4%</strong> (conservative, 30+ yr horizon) • <strong>4–5%</strong> (moderate) • <strong>5%+</strong> (aggressive)
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${isSaving ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-sm'}`}
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </FormCard>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Settings</h4>
        <div className="flex gap-6">
          <div>
            <div className="text-2xl font-bold text-violet-600">{r?.age ?? 65}</div>
            <div className="text-xs text-slate-500">Retirement Age</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-violet-600">{((r?.withdrawalRate ?? 0.04) * 100).toFixed(1)}%</div>
            <div className="text-xs text-slate-500">Withdrawal Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemList<T extends { id: string }>({
  items, icon, iconBg, iconColor, renderLabel, renderDetail, onRemove, emptyIcon, emptyText, emptyHint,
}: {
  items: T[];
  icon: string;
  iconBg: string;
  iconColor: string;
  renderLabel: (item: T) => string;
  renderDetail: (item: T) => string;
  onRemove: (item: T) => void;
  emptyIcon: string;
  emptyText: string;
  emptyHint: string;
}) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center`}>
              <span className={`${iconColor} text-sm`}>{icon}</span>
            </div>
            <div>
              <span className="font-medium text-slate-800">{renderLabel(item)}</span>
              <div className="text-sm text-slate-600">{renderDetail(item)}</div>
            </div>
          </div>
          <button
            onClick={() => onRemove(item)}
            className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all text-sm font-medium border border-red-200"
          >
            Delete
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">{emptyIcon}</div>
          <p>{emptyText}</p>
          <p className="text-sm">{emptyHint}</p>
        </div>
      )}
    </div>
  );
}
