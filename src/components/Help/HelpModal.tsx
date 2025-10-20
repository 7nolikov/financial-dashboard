import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Financial Life Tracker - Help & Guide</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* How to Use */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-600">How to Use</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold">1. Set Your Birth Date</h4>
                  <p>Enter your date of birth to align the timeline with your actual age.</p>
                </div>
                <div>
                  <h4 className="font-semibold">2. Choose a Demo Preset</h4>
                  <p>Start with Worker, Investor, Businessman, or Loaner presets to see different financial scenarios.</p>
                </div>
                <div>
                  <h4 className="font-semibold">3. Add Your Financial Data</h4>
                  <p>Use the Data Entry tabs to add incomes, expenses, investments, and retirement plans.</p>
                </div>
                <div>
                  <h4 className="font-semibold">4. Configure Settings</h4>
                  <p>Set safety savings rules, interest rates, and inflation settings.</p>
                </div>
                <div>
                  <h4 className="font-semibold">5. Analyze Your Timeline</h4>
                  <p>View your financial trajectory, zoom in/out, and add milestones.</p>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-600">Use Cases</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold">📊 Financial Planning</h4>
                  <p>Plan your financial future by modeling different income, expense, and investment scenarios.</p>
                </div>
                <div>
                  <h4 className="font-semibold">🏠 Major Life Events</h4>
                  <p>See how buying a house, having kids, or changing careers affects your net worth.</p>
                </div>
                <div>
                  <h4 className="font-semibold">💰 Retirement Planning</h4>
                  <p>Determine if you're on track for retirement and adjust your savings strategy.</p>
                </div>
                <div>
                  <h4 className="font-semibold">📈 Investment Analysis</h4>
                  <p>Compare different investment strategies and their long-term impact.</p>
                </div>
                <div>
                  <h4 className="font-semibold">🎯 Goal Setting</h4>
                  <p>Set financial milestones and track progress toward achieving them.</p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-600">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">+</kbd></span>
                  <span>Zoom in on timeline</span>
                </div>
                <div className="flex justify-between">
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">-</kbd></span>
                  <span>Zoom out on timeline</span>
                </div>
                <div className="flex justify-between">
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">0</kbd></span>
                  <span>Reset zoom to full view</span>
                </div>
                <div className="flex justify-between">
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd></span>
                  <span>Close modals and clear selections</span>
                </div>
                <div className="flex justify-between">
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd></span>
                  <span>Navigate between form fields</span>
                </div>
              </div>
            </div>

            {/* Tips & Tricks */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-orange-600">Tips & Tricks</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold">🎯 Focus on Net Worth</h4>
                  <p>The purple line shows your net worth - the most important metric for financial health.</p>
                </div>
                <div>
                  <h4 className="font-semibold">⚠️ Watch Danger Zones</h4>
                  <p>Red shaded areas indicate periods when your net worth is negative - plan to avoid these.</p>
                </div>
                <div>
                  <h4 className="font-semibold">📊 Use Real vs Nominal</h4>
                  <p>Switch between nominal (with inflation) and real (inflation-adjusted) views to understand true purchasing power.</p>
                </div>
                <div>
                  <h4 className="font-semibold">🔍 Zoom for Details</h4>
                  <p>Scroll to zoom in on specific time periods for detailed analysis.</p>
                </div>
                <div>
                  <h4 className="font-semibold">📈 Track Extremums</h4>
                  <p>Green circles show peaks, red circles show troughs - important financial milestones.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Need More Help?</h3>
            <p className="text-sm text-blue-700">
              This tool helps you visualize your financial future. Start with a demo preset, then customize it with your own data. 
              Remember: this is for planning purposes only and doesn't constitute financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
