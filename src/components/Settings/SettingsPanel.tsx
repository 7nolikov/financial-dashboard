import React from 'react';
import { useStore, SafetySavingsRule } from '../../state/store';

function uid(prefix: string) { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }

export function SettingsPanel() {
  const rules = useStore((s) => s.safetySavings);
  const removeSafetySavings = useStore((s) => s.removeSafetySavings);
  const setInflation = useStore((s) => s.setInflation);
  const state = useStore();
  const [label, setLabel] = React.useState('Safety Period');
  const [months, setMonths] = React.useState(6);
  const [monthly, setMonthly] = React.useState(3000);
  const [startAge, setStartAge] = React.useState(25);
  const [isAdding, setIsAdding] = React.useState(false);
  
  const addRule = async () => {
    if (!label.trim() || months <= 0 || monthly <= 0 || startAge < 0 || startAge > 100) return;
    setIsAdding(true);
    try {
      const r: SafetySavingsRule = { id: uid('ss'), label, start: { ageYears: startAge, monthIndex: startAge * 12 }, monthsCoverage: months, monthlyExpenses: monthly };
      useStore.setState({ safetySavings: [...state.safetySavings, r] });
      setLabel('Safety Period');
      setMonths(6);
      setMonthly(3000);
      setStartAge(25);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm font-medium mb-3">Settings</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-xs text-slate-600">Safety savings (add period)</div>
          <div className="text-xs text-slate-500 mb-2">Set emergency fund targets for different life stages</div>
          <div className="flex gap-2 items-end flex-wrap">
            <input className="border rounded px-2 py-1" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <input type="number" className="border rounded px-2 py-1 w-24" placeholder="Months" min="1" max="60" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            <input type="number" className="border rounded px-2 py-1 w-28" placeholder="$ per month" min="0" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
            <input type="number" className="border rounded px-2 py-1 w-24" placeholder="Start age" min="0" max="100" value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} />
            <button 
              className={`px-3 py-1 border rounded ${isAdding ? 'bg-gray-400' : 'bg-slate-900'} text-white`}
              disabled={isAdding}
              onClick={addRule}
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {rules.map((r) => (
              <div key={r.id} className="flex justify-between items-center p-2 border rounded bg-gray-50">
                <span className="text-sm">{r.label}: {r.monthsCoverage} months of ${r.monthlyExpenses.toLocaleString()}</span>
                <button onClick={() => removeSafetySavings(r.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-slate-600">Interest rates (global)</div>
          <div className="text-xs text-slate-500 mb-2">Set default investment return rate</div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Expected APR %</span>
            <input 
              type="number" 
              step="0.1" 
              min="0" 
              max="50" 
              className="border rounded px-2 py-1 w-24" 
              defaultValue={6.5} 
              placeholder="6.5"
              onChange={(e) => {
                const val = Math.max(0, Math.min(50, Number(e.target.value))) / 100;
                // update all fixed models for demo
                useStore.setState({ investments: state.investments.map((i) => ({ ...i, model: i.model.type === 'fixed' ? { type: 'fixed', fixedRate: val } : i.model })) });
              }} 
            />
          </div>
          <div className="text-xs text-slate-500">
            💡 Historical stock market returns: 7-10% annually
          </div>
        </div>
      </div>
    </div>
  );
}


