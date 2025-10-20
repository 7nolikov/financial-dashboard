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
            onChange={(e) => e.target.value && loadPreset(e.target.value as any)}
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
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col"><label className="text-xs">Label</label><input className="border rounded px-2 py-1" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col"><label className="text-xs">Amount</label><input type="number" className="border rounded px-2 py-1 w-28" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Start age</label><input type="number" className="border rounded px-2 py-1 w-20" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">End age</label><input type="number" className="border rounded px-2 py-1 w-20" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        <button
          className="px-3 py-1 border rounded bg-slate-900 text-white"
          onClick={() => {
            const inc: Income = {
              id: uid('inc'), label, amount,
              recurrence: { kind: 'recurring', start: { ageYears: startAge, monthIndex: startAge * 12 }, end: endAge === '' ? undefined : { ageYears: Number(endAge), monthIndex: Number(endAge) * 12 }, everyMonths: 1 },
            };
            addIncome(inc);
          }}
        >Add</button>
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
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col"><label className="text-xs">Label</label><input className="border rounded px-2 py-1" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col"><label className="text-xs">Amount</label><input type="number" className="border rounded px-2 py-1 w-28" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Start age</label><input type="number" className="border rounded px-2 py-1 w-20" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">End age</label><input type="number" className="border rounded px-2 py-1 w-20" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        <button
          className="px-3 py-1 border rounded bg-slate-900 text-white"
          onClick={() => {
            const exp: Expense = {
              id: uid('exp'), label, amount,
              recurrence: { kind: 'recurring', start: { ageYears: startAge, monthIndex: startAge * 12 }, end: endAge === '' ? undefined : { ageYears: Number(endAge), monthIndex: Number(endAge) * 12 }, everyMonths: 1 },
            };
            addExpense(exp);
          }}
        >Add</button>
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
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col"><label className="text-xs">Label</label><input className="border rounded px-2 py-1" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="flex flex-col"><label className="text-xs">Monthly</label><input type="number" className="border rounded px-2 py-1 w-28" value={recurringAmount} onChange={(e) => setRecurringAmount(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">APR %</label><input type="number" className="border rounded px-2 py-1 w-24" step="0.1" value={fixedRate} onChange={(e) => setFixedRate(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">Start age</label><input type="number" className="border rounded px-2 py-1 w-20" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></div>
        <div className="flex flex-col"><label className="text-xs">End age</label><input type="number" className="border rounded px-2 py-1 w-20" value={endAge} onChange={(e) => setEndAge(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        <button
          className="px-3 py-1 border rounded bg-slate-900 text-white"
          onClick={() => {
            const inv: Investment = {
              id: uid('inv'), label, principal: 0, recurringAmount,
              recurrence: { kind: 'recurring', start: { ageYears: startAge, monthIndex: startAge * 12 }, end: endAge === '' ? undefined : { ageYears: Number(endAge), monthIndex: Number(endAge) * 12 }, everyMonths: 1 },
              model: { type: 'fixed', fixedRate: fixedRate / 100 },
            };
            addInvestment(inv);
          }}
        >Add</button>
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
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col"><label className="text-xs">Retirement age</label><input type="number" className="border rounded px-2 py-1 w-24" value={age} onChange={(e) => setAge(Number(e.target.value))} /></div>
      <div className="flex flex-col"><label className="text-xs">Withdrawal %</label><input type="number" className="border rounded px-2 py-1 w-24" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
      <button className="px-3 py-1 border rounded bg-slate-900 text-white" onClick={() => setR({ age, withdrawalRate: rate/100 })}>Save</button>
    </div>
  );
}


