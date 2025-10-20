import React from 'react';
import { AreaChart } from './components/Timeline/AreaChart';
import { TopBar } from './components/TopBar';
import { DataEntryPanel } from './components/DataEntry/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ShareModal } from './components/Share/ShareModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <TopBar />
        <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Chart Section - Full Width */}
          <div className="mb-8">
            <div id="timeline-capture" className="shadow-xl rounded-2xl overflow-hidden bg-white border border-slate-200">
              <AreaChart />
            </div>
          </div>
          
          {/* Control Panels - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Data Entry Panel */}
            <div className="space-y-6">
              <div className="shadow-lg rounded-2xl overflow-hidden bg-white border border-slate-200">
                <DataEntryPanel />
              </div>
            </div>
            
            {/* Settings Panel */}
            <div className="space-y-6">
              <div className="shadow-lg rounded-2xl overflow-hidden bg-white border border-slate-200">
                <SettingsPanel />
              </div>
            </div>
          </div>
        </main>
        <ShareModal />
      </div>
    </ErrorBoundary>
  );
}


