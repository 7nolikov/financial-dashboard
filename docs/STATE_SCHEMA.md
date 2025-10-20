# State Schema

Core types for persisted app state. Full reference lives in `financial.plan.md`.

- Versioned `CoreState` with: `dobISO`, `incomes`, `expenses`, `investments`, `safetySavings`, `retirement`, `milestones`, `inflation`, `chart.zoom`.
- Recurrence supports `one_time` and `recurring` with `everyMonths` cadence.
- Inflation config: average (single rate), yearly table, or imported; base year; apply-to flags; display mode (nominal/real).

Data invariants:
- `monthIndex ∈ [0, 1199]` maps to age 0..100 years.
- Amounts are expressed in base-year currency; inflation converts for nominal view.
- Migrations must bump `version` and provide deterministic transforms.
