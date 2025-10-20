import React from 'react';
import { useStore, Income, Expense, Investment } from '../../state/store';

function uid(prefix: string) { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }

export function DataEntryPanel() {
  const [tab, setTab] = React.useState<'income' | 'expense' | 'investment' | 'retirement'>('income');
  const loadPreset = useStore((s) => s.loadPreset);
  const clearAllData = useStore((s) => s.clearAllData);
  
  return (
    <div className="rounded-lg border bg-white">
      <div className="p-3 border-b bg-slate-50">
        <div className="flex items-center gap-3 mb-2">
          <label className="text-sm font-medium text-slate-700">Demo Presets:</label>
          <select 
            onChange={(e) => e.target.value && loadPreset(e.target.value as 'worker' | 'investor' | 'businessman' | 'loaner')}
            className="border px-2 py-1 rounded text-sm"
            defaultValue="worker"
          >
            <option value="worker">👷 Worker</option>
            <option value="investor">📈 Investor</option>
            <option value="businessman">💼 Businessman</option>
            <option value="loaner">🎓 Loaner</option>
          </select>
          <button 
            onClick={clearAllData}
            className="text-xs px-3 py-1 border rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
            title="Clear all data and start from scratch"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="flex gap-2 p-2 border-b text-sm flex-wrap">
        <TabButton active={tab === 'income'} onClick={() => setTab('income')} title="Add monthly pay or other income">Income</TabButton>
        <TabButton active={tab === 'expense'} onClick={() => setTab('expense')} title="Add bills and other costs">Expenses</TabButton>
        <TabButton active={tab === 'investment'} onClick={() => setTab('investment')} title="Add investment contributions and rates">Investments</TabButton>
        <TabButton active={tab === 'retirement'} onClick={() => setTab('retirement')} title="Set retirement age and withdrawal %">Retirement</TabButton>
      </div>
      <div className="p-4">
        {tab === 'income' && <IncomeTab />}
        {tab === 'expense' && <ExpenseTab />}
        {tab === 'investment' && <InvestmentTab />}
        {tab === 'retirement' && <RetirementTab />}
      </div>
    </div>
  );
}

function TabButton(props: React.PropsWithChildren<{ active: boolean; onClick: () => void; title?: string }>) {
  return (
    <button onClick={props.onClick} className={`px-2 py-1 rounded ${props.active ? 'bg-slate-900 text-white' : 'border'}`} title={props.title}>{props.children}</button>
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
    <div className="space-y-3">
      <div className="text-xs text-slate-600 mb-2">Add monthly income sources (salary, freelance, etc.)</div>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col"><label className="text-xs">Label</label><input className="border rounded px-2 py-1" placeholder="e.g., Salary" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col"><label className="text-xs">Monthly Amount ($)</label><input type="number" className="border rounded px-2 py-1 w-28" placeholder="3500" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Start Age</label><input type="number" className="border rounded px-2 py-1 w-20" placeholder="22" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">End Age (optional)</label><input type="number" className="border rounded px-2 py-1 w-20" placeholder="65" min="0" max="100" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        <button
          className={`px-3 py-1 border rounded ${isAdding ? 'bg-gray-400' : 'bg-slate-900'} text-white`}
          disabled={isAdding}
          onClick={handleAdd}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {incomes.map((i) => (
          <div key={i.id} className="flex justify-between items-center p-2 border rounded bg-gray-50">
            <span className="text-sm">{i.label} – ${i.amount.toLocaleString()}/m</span>
            <button onClick={() => removeIncome(i.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpenseTab() {
  const expenses = useStore((s) => s.expenses);
  const addExpense = useStore((s) => s.addExpense);
  const removeExpense = useStore((s) => s.removeExpense);
  const [label, setLabel] = React.useState('New Expense');
  const [amount, setAmount] = React.useState(1000);
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
      setAmount(1000);
      setStartAge(22);
      setEndAge('');
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600 mb-2">Add monthly expenses (rent, utilities, groceries, etc.)</div>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col"><label className="text-xs">Label</label><input className="border rounded px-2 py-1" placeholder="e.g., Rent" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col"><label className="text-xs">Monthly Amount ($)</label><input type="number" className="border rounded px-2 py-1 w-28" placeholder="1200" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Start Age</label><input type="number" className="border rounded px-2 py-1 w-20" placeholder="22" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">End Age (optional)</label><input type="number" className="border rounded px-2 py-1 w-20" placeholder="65" min="0" max="100" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        <button
          className={`px-3 py-1 border rounded ${isAdding ? 'bg-gray-400' : 'bg-slate-900'} text-white`}
          disabled={isAdding}
          onClick={handleAdd}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {expenses.map((i) => (
          <div key={i.id} className="flex justify-between items-center p-2 border rounded bg-gray-50">
            <span className="text-sm">{i.label} – ${i.amount.toLocaleString()}/m</span>
            <button onClick={() => removeExpense(i.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
          </div>
        ))}
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
    <div className="space-y-3">
      <div className="text-xs text-slate-600 mb-2">Add monthly investment contributions (401k, IRA, brokerage, etc.)</div>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col"><label className="text-xs">Label</label><input className="border rounded px-2 py-1" placeholder="e.g., 401k" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col"><label className="text-xs">Monthly Contribution ($)</label><input type="number" className="border rounded px-2 py-1 w-28" placeholder="500" min="0" value={recurringAmount} onChange={(e) => setRecurringAmount(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Expected APR %</label><input type="number" className="border rounded px-2 py-1 w-24" step="0.1" min="0" max="50" placeholder="6.5" value={fixedRate} onChange={(e) => setFixedRate(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Start Age</label><input type="number" className="border rounded px-2 py-1 w-20" placeholder="22" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">End Age</label><input type="number" className="border rounded px-2 py-1 w-20" placeholder="65" min="0" max="100" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        <button
          className={`px-3 py-1 border rounded ${isAdding ? 'bg-gray-400' : 'bg-slate-900'} text-white`}
          disabled={isAdding}
          onClick={handleAdd}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {investments.map((i) => (
          <div key={i.id} className="flex justify-between items-center p-2 border rounded bg-gray-50">
            <span className="text-sm">{i.label} – ${(i.recurringAmount ?? 0).toLocaleString()}/m @ {((i.model.fixedRate ?? 0)*100).toFixed(1)}%</span>
            <button onClick={() => removeInvestment(i.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
          </div>
        ))}
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
      setR({ age, withdrawalRate: rate/100 });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600 mb-2">Set your retirement age and annual withdrawal rate</div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col"><label className="text-xs">Retirement Age</label><input type="number" className="border rounded px-2 py-1 w-24" min="50" max="100" placeholder="65" value={age} onChange={(e) => setAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Annual Withdrawal %</label><input type="number" className="border rounded px-2 py-1 w-24" step="0.1" min="0" max="20" placeholder="4.0" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
        <button 
          className={`px-3 py-1 border rounded ${isSaving ? 'bg-gray-400' : 'bg-slate-900'} text-white`}
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="text-xs text-slate-500">
        💡 Common withdrawal rates: 3-4% (conservative), 4-5% (moderate), 5%+ (aggressive)
      </div>
    </div>
  );
}


