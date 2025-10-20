import React from 'react';
import { useStore, SafetySavingsRule } from '../../state/store';

function uid(prefix: string) { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }

export function SettingsPanel() {
  const rules = useStore((s) => s.safetySavings);
  const removeSafetySavings = useStore((s) => s.removeSafetySavings);
  const state = useStore();
  const [label, setLabel] = React.useState('Emergency Fund');
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
      setLabel('Emergency Fund');
      setMonths(6);
      setMonthly(3000);
      setStartAge(25);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Settings & Configuration</h2>
          <p className="text-sm text-slate-600 mt-1">Configure safety savings and investment defaults</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Safety Savings */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                Safety Savings Rules
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Define emergency fund targets for different life stages. The chart will show when you have enough savings to cover your expenses.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Rule Name</label>
                  <input 
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                    placeholder="e.g., Emergency Fund" 
                    value={label} 
                    onChange={(e) => setLabel(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Months of Coverage</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                    placeholder="6" 
                    min="1" 
                    max="60" 
                    value={months} 
                    onChange={(e) => setMonths(Number(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Monthly Expenses ($)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                    placeholder="3000" 
                    min="0" 
                    value={monthly} 
                    onChange={(e) => setMonthly(Number(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Start Age</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                    placeholder="25" 
                    min="0" 
                    max="100" 
                    value={startAge} 
                    onChange={(e) => setStartAge(Number(e.target.value))} 
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    isAdding 
                      ? 'bg-slate-400 text-white cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm'
                  }`}
                  disabled={isAdding}
                  onClick={addRule}
                >
                  {isAdding ? 'Adding...' : 'Add Safety Rule'}
                </button>
              </div>
            </div>
            
            {/* Current Rules */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Current Safety Rules ({rules.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rules.map((r) => (
                  <div key={r.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🛡️</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">{r.label}</span>
                        <div className="text-sm text-slate-600">
                          {r.monthsCoverage} months × ${r.monthlyExpenses.toLocaleString()}/month = ${(r.monthsCoverage * r.monthlyExpenses).toLocaleString()} target
                        </div>
                        <div className="text-xs text-slate-500">Starts at age {r.start.ageYears}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeSafetySavings(r.id)} 
                      className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {rules.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <div className="text-4xl mb-2">🛡️</div>
                    <p>No safety savings rules defined</p>
                    <p className="text-sm">Add your first safety rule above</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Investment Settings */}
          <div className="space-y-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                <span className="text-xl">📈</span>
                Investment Defaults
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Set the default expected return rate for new investments. This helps estimate long-term growth.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Default Expected Annual Return</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="50" 
                      className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                      defaultValue={6.5} 
                      placeholder="6.5"
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(50, Number(e.target.value))) / 100;
                        // update all fixed models for demo
                        useStore.setState({ investments: state.investments.map((i) => ({ ...i, model: i.model.type === 'fixed' ? { type: 'fixed', fixedRate: val } : i.model })) });
                      }} 
                    />
                    <span className="text-sm text-slate-500 font-medium">%</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="font-medium text-slate-800 mb-2">💡 Historical Context</h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>• <strong>Conservative (3-5%):</strong> Bonds, CDs, savings accounts</div>
                    <div>• <strong>Moderate (6-8%):</strong> Balanced funds, index funds</div>
                    <div>• <strong>Aggressive (8-12%):</strong> Stock market, growth funds</div>
                    <div>• <strong>Historical S&P 500:</strong> ~10% annually (with volatility)</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Quick Tips
              </h3>
              <div className="text-sm text-purple-700 space-y-2">
                <div>• <strong>Emergency Fund:</strong> 3-6 months of expenses</div>
                <div>• <strong>Safety Target:</strong> Shows when you have enough savings</div>
                <div>• <strong>Investment Returns:</strong> Use conservative estimates for planning</div>
                <div>• <strong>Inflation:</strong> Consider real vs nominal returns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


