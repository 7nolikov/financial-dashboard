import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useStore } from '../state/store';
import { DataEntryPanel } from './DataEntry/Panel';
import { SettingsPanel } from './Settings/SettingsPanel';

/**
 * EditPlanDrawer — all configuration in a focused right-side slide-over.
 *
 * Previously the data-entry forms and settings lived in a giant always-present
 * accordion that pushed the chart far down the page. Moving them into a drawer
 * keeps the dashboard a single viewport while still putting every control one
 * click away. Global assumptions (date of birth, inflation) sit at the top
 * because they reshape the whole projection.
 */
export function EditPlanDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [tab, setTab] = React.useState<'data' | 'settings'>('data');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl bg-background border-l border-border shadow-2xl flex flex-col focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-border bg-card safe-top">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Edit your plan
            </Dialog.Title>
            <Dialog.Close className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* Global assumptions */}
          <Assumptions />

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Configuration sections"
            className="shrink-0 flex border-b border-border bg-card px-2"
          >
            <TabButton active={tab === 'data'} onClick={() => setTab('data')}>
              Data
            </TabButton>
            <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>
              Safety & defaults
            </TabButton>
          </div>

          {/* Scrollable panel body */}
          <div className="flex-1 min-h-0 overflow-y-auto safe-bottom">
            {tab === 'data' ? <DataEntryPanel /> : <SettingsPanel />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: React.PropsWithChildren<{ active: boolean; onClick: () => void }>) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

/** Date of birth + inflation rate — the two assumptions that reshape every series. */
function Assumptions() {
  const dobISO = useStore((s) => s.dobISO);
  const setDOB = useStore((s) => s.setDOB);
  const inflation = useStore((s) => s.inflation);
  const setInflation = useStore((s) => s.setInflation);

  return (
    <div className="shrink-0 grid grid-cols-2 gap-3 px-5 py-3 bg-muted/40 border-b border-border">
      <label className="block">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Date of birth
        </span>
        <input
          type="date"
          value={dobISO}
          onChange={(e) => setDOB(e.target.value)}
          min="1900-01-01"
          max={new Date().toISOString().slice(0, 10)}
          className="mt-1 w-full h-10 bg-card border border-border px-3 rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition-all"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Inflation rate (%)
        </span>
        <input
          type="number"
          step="0.1"
          min="0"
          max="20"
          value={((inflation.singleRate ?? 0) * 100).toFixed(1)}
          onChange={(e) =>
            setInflation({ singleRate: Math.max(0, Math.min(20, Number(e.target.value))) / 100 })
          }
          className="mt-1 w-full h-10 bg-card border border-border px-3 rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition-all"
        />
      </label>
    </div>
  );
}
