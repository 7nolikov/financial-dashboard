# Architecture

App shell hosts Timeline, Summary KPIs, Data Entry, Settings, and Share. State is managed by Zustand with derived selectors. Calculations run per month across 0–100 years and respect inflation.

App
├─ TopBar (DOB, Share, Settings, Real/Nominal)
├─ Timeline (Visx, zoom, milestones)
├─ SummaryKpis
└─ DataEntryPanel (Income | Expenses | Investments | Retirement)

Data Flow: Forms → Store → Selectors (series, KPIs) → Timeline render → Autosave.
