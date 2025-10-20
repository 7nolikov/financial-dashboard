import React from 'react';

export function OnboardingTips() {
  const [visible, setVisible] = React.useState<boolean>(() => {
    try { return localStorage.getItem('flt-onboarded') !== '1'; } catch { return true; }
  });
  if (!visible) return null;
  function dismiss() {
    try { localStorage.setItem('flt-onboarded', '1'); } catch {
      // Ignore localStorage errors
    }
    setVisible(false);
  }
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 text-[13px]">
          <div className="text-sm font-medium">Welcome — How to use</div>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">Timeline</span>: scroll to zoom horizontally; click to add a milestone. Hover to see values and labels.</li>
            <li><span className="font-medium">DOB</span>: pick your date of birth; ages on the axis update accordingly.</li>
            <li><span className="font-medium">Real/Nominal</span>: switch between inflation-adjusted values (real, base year) and nominal values.</li>
            <li><span className="font-medium">Inflation %</span>: average yearly rate applied to incomes, expenses, contributions, and safety savings (configurable in Settings).</li>
            <li><span className="font-medium">Data Entry</span>: add recurring or one-time income, expenses, and investment contributions; set retirement age and withdrawal rate.</li>
            <li><span className="font-medium">Settings</span>: define safety savings periods and global interest rate; choose which categories index with inflation.</li>
            <li><span className="font-medium">Share</span>: open preview and download a .jpg of the current dashboard.</li>
            <li><span className="font-medium">Reset Zoom</span>: button below the chart or press <code>R</code>.</li>
          </ul>
        </div>
        <button className="px-4 py-2 border border-slate-300 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm" onClick={dismiss}>Got it</button>
      </div>
    </div>
  );
}


