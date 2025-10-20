import React from 'react';
import { AreaChart } from './components/Timeline/AreaChart';
import { useStore } from './state/store';
import { TopBar } from './components/TopBar';
import { DataEntryPanel } from './components/DataEntry/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ShareModal } from './components/Share/ShareModal';

export default function App() {
  const setDOB = useStore((s) => s.setDOB);
  const dobISO = useStore((s) => s.dobISO);
  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div id="timeline-capture">
          <AreaChart />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="max-h-96 overflow-y-auto">
            <DataEntryPanel />
          </div>
          <div className="max-h-96 overflow-y-auto">
            <SettingsPanel />
          </div>
        </div>
      </main>
      <ShareModal />
    </div>
  );
}


