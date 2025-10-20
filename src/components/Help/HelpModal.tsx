import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Financial Life Tracker</h2>
              <p className="text-blue-100 text-lg">Help & User Guide</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              title="Close help"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          
          {/* Quick Start Guide */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <h3 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-3">
                <span className="text-3xl">🚀</span>
                Quick Start Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-emerald-600 font-semibold mb-2">1. Choose Preset</div>
                  <p className="text-sm text-slate-600">Start with Worker, Investor, Businessman, or Loaner to see realistic scenarios.</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-emerald-600 font-semibold mb-2">2. Set Your DOB</div>
                  <p className="text-sm text-slate-600">Enter your birth date to align the timeline with your actual age.</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-emerald-600 font-semibold mb-2">3. Customize Data</div>
                  <p className="text-sm text-slate-600">Add your incomes, expenses, and investments using the data entry panel.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* How to Use */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-3">
                <span className="text-2xl">📋</span>
                How to Use
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Set Your Birth Date</h4>
                    <p className="text-sm text-slate-600">Enter your date of birth to align the timeline with your actual age.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Choose a Demo Preset</h4>
                    <p className="text-sm text-slate-600">Start with Worker, Investor, Businessman, or Loaner presets to see different financial scenarios.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Add Your Financial Data</h4>
                    <p className="text-sm text-slate-600">Use the Data Entry tabs to add incomes, expenses, investments, and retirement plans.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Configure Settings</h4>
                    <p className="text-sm text-slate-600">Set safety savings rules, interest rates, and inflation settings.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">5</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Analyze Your Timeline</h4>
                    <p className="text-sm text-slate-600">View your financial trajectory, zoom in/out, and add milestones.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold mb-6 text-green-600 flex items-center gap-3">
                <span className="text-2xl">💡</span>
                Use Cases
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Financial Planning</h4>
                    <p className="text-sm text-slate-600">Plan your financial future by modeling different income, expense, and investment scenarios.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Major Life Events</h4>
                    <p className="text-sm text-slate-600">See how buying a house, having kids, or changing careers affects your net worth.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <span className="text-2xl">💰</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Retirement Planning</h4>
                    <p className="text-sm text-slate-600">Determine if you're on track for retirement and adjust your savings strategy.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <span className="text-2xl">📈</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Investment Analysis</h4>
                    <p className="text-sm text-slate-600">Compare different investment strategies and their long-term impact.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Goal Setting</h4>
                    <p className="text-sm text-slate-600">Set financial milestones and track progress toward achieving them.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold mb-6 text-purple-600 flex items-center gap-3">
                <span className="text-2xl">⌨️</span>
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">Ctrl</kbd>
                    <span className="text-slate-500">+</span>
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">+</kbd>
                  </div>
                  <span className="text-sm text-slate-700">Zoom in on timeline</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">Ctrl</kbd>
                    <span className="text-slate-500">+</span>
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">-</kbd>
                  </div>
                  <span className="text-sm text-slate-700">Zoom out on timeline</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">Ctrl</kbd>
                    <span className="text-slate-500">+</span>
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">0</kbd>
                  </div>
                  <span className="text-sm text-slate-700">Reset zoom to full view</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">Esc</kbd>
                  </div>
                  <span className="text-sm text-slate-700">Close modals and clear selections</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-mono">Tab</kbd>
                  </div>
                  <span className="text-sm text-slate-700">Navigate between form fields</span>
                </div>
              </div>
            </div>

            {/* Tips & Tricks */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold mb-6 text-orange-600 flex items-center gap-3">
                <span className="text-2xl">💎</span>
                Pro Tips
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Focus on Net Worth</h4>
                    <p className="text-sm text-slate-600">The purple line shows your net worth - the most important metric for financial health.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Watch Danger Zones</h4>
                    <p className="text-sm text-slate-600">Red shaded areas indicate periods when your net worth is negative - plan to avoid these.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Use Real vs Nominal</h4>
                    <p className="text-sm text-slate-600">Switch between nominal (with inflation) and real (inflation-adjusted) views to understand true purchasing power.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Zoom for Details</h4>
                    <p className="text-sm text-slate-600">Scroll to zoom in on specific time periods for detailed analysis.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="text-2xl">📈</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Track Extremums</h4>
                    <p className="text-sm text-slate-600">Green circles show peaks, red circles show troughs - important financial milestones.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-bold text-blue-800 mb-2 text-lg">Need More Help?</h3>
                <p className="text-blue-700 leading-relaxed">
                  This tool helps you visualize your financial future. Start with a demo preset, then customize it with your own data. 
                  Remember: this is for planning purposes only and doesn't constitute financial advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
