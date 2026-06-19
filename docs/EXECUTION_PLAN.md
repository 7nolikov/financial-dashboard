# Execution Plan — Viral Launch 2026

Status log + open work for the Financial Life Tracker. Granular before/after
notes that only restate the current code have been dropped; the git history
holds those.

## Information architecture (current)

```
Level 1 — Overview (OverviewCard, never null)
  6 KPIs (Income | Expenses | Net Worth | Investments | Loans | Cash Flow)
  + FIRE grade, target, age, savings rate, progress bar (when expenses > 0)
Level 2 — Timeline (AreaChart)
  Areas + lines, FIRE & retirement markers, danger/warning zones,
  derived milestones, hover/tap tooltip; pinch/scroll zoom, pan
Level 3 — Configuration (collapsible)
  Data Entry tabs | Settings tab
```

## Shipped (Phases 1–12)

- **Emotional hook**: RealityCheck hero with rotating 2026 crisis stats; one-click "Average European" preset; session-based dismissal.
- **Shareable output**: OverviewCard with letter grade + KPIs; share to X/Reddit/WhatsApp/LinkedIn, copy-link, JPG export.
- **2026 crisis positioning**: Gig Worker preset, pension-gap framing, urgency footer CTA, OG/Twitter meta.
- **Hierarchy**: merged FireInsights + ScoreCard → OverviewCard; removed rogue in-chart KPI row; true 3-level layout.
- **Chart quality**: visible grid, gradient fills, FIRE/retirement markers, loans + safety series, readable axis labels with tabular nums.
- **Milestones**: auto-derived from data entries (no manual click-to-add); overlap resolver; label truncation.
- **Onboarding**: QuickStart strip with presets for the empty state.
- **Docs**: README rewritten as user-facing; stale docs removed.

## Phase 13: Security hardening — untrusted share-link input (DONE)

Audited June 2026. The app is local-first (no backend/auth), so the only real
attack surface is untrusted data entering the client. The share link
(`#state=<base64>`) is attacker-controllable and was parsed and merged into the
store with **zero validation**.

| #   | Severity | Issue                                                                                                                                                                                                                                     |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **High** | **Tab-freeze DoS.** `inflationFactorSinceBase()` loops `for (y = baseYear; y < calendarYear; y++)` with `baseYear` straight from the URL. `baseYear: -1e9` + `mode: "yearlyTable"` spins ~a billion iterations and hangs the tab on load. |
| 2   | **High** | **Persistent app-brick DoS.** A non-array `incomes`/`expenses`/… makes `computeSeries()` throw during render; zustand persists the bad state, so the crash survives reload until storage is manually cleared.                             |
| 3   | Medium   | `everyMonths: 0` → `% 0 = NaN` (drops all contributions); `NaN`/`Infinity` amounts propagate through the math.                                                                                                                            |

Not vulnerable (verified): no XSS (React escapes, no `dangerouslySetInnerHTML`); all `window.open` calls use `noopener,noreferrer`.

**Fixes**: `sanitizeSharedState()` validates/clamps every field and drops malformed entries (new `src/lib/validation/shared-state.ts`); wired into the share-link decode (`src/lib/sharing.ts`) and `migrateState()` (`src/state/store.ts`); inflation loop clamps the year span to ±300 (`src/lib/calc/inflation.ts`); 9 regression tests (`tests/validation/shared-state.test.ts`). A production-only CSP is injected at build time via `vite.config.ts`.

## Phase 14: UX & marketing findings (DONE)

| Finding                                                                             | Lens      | Resolution                                                                                                                                  |
| ----------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical/OG/JSON-LD/robots pointed to `github.io`; live site is `7nolikov.dev`.    | SEO       | Aligned every reference to `https://7nolikov.dev/financial-dashboard/` (custom domain cascades from the user Pages site — no repo `CNAME`). |
| `robots.txt` referenced a missing `sitemap.xml`.                                    | SEO       | Created `public/sitemap.xml`.                                                                                                               |
| Shared-link load gave no feedback — valid and broken links both fell back silently. | UX        | Mounted `sonner` `<Toaster />`; success/error toasts on load.                                                                               |
| Crisis stats had no visible attribution (`source` was never rendered).              | Marketing | Render `Indicative figure · {source}` under each stat.                                                                                      |
| Chart tooltip was hover-only — touch users couldn't read point values.              | UX        | Tap-to-inspect on mobile (single-finger tap → tooltip).                                                                                     |
| CSP hardening.                                                                      | Security  | Build-time CSP meta (dev unaffected).                                                                                                       |
| "Clear all data" destructiveness.                                                   | UX        | Already guarded by a two-step confirm — no change.                                                                                          |

## Launch checklist (manual)

- [ ] Verify production deploy at https://7nolikov.dev/financial-dashboard/
- [ ] Validate OG/Twitter card previews
- [ ] Test all 6 presets load
- [ ] Test every share flow (X, Reddit, WhatsApp, LinkedIn, copy-link, JPG)
- [ ] Test on real iPhone + Android (layout, tap-to-inspect, pinch/pan)
- [ ] Test RealityCheck dismiss/reappear (session-based)
- [ ] Test FIRE + retirement markers render

Seed channels: r/personalfinance, r/fire, r/europeanfire, X, LinkedIn, Hacker News (Show HN), Product Hunt. Core loop: scary stat → run tool → letter grade → share → repeat.

## Backlog

| Task                                        | Impact | Effort |
| ------------------------------------------- | ------ | ------ |
| Scorecard image export (OverviewCard → PNG) | HIGH   | LOW    |
| Dynamic OG image per shared link            | HIGH   | HIGH   |
| Currency selector (EUR/USD/GBP)             | MEDIUM | MEDIUM |
| "Compare to peers" benchmark overlay        | HIGH   | MEDIUM |
| Guided onboarding tour                      | MEDIUM | MEDIUM |
| Focus trap for ShareModal/HelpModal         | MEDIUM | LOW    |
| Dark mode toggle UI (infra exists)          | LOW    | LOW    |
| E2E tests in CI                             | LOW    | LOW    |

## Verification (Pass 6 — June 2026)

- TypeScript: **PASS** · ESLint: **PASS** (0/0)
- Unit tests: **57/57 PASS** (9 new security/validation tests)
- Production build: **SUCCESS** (~371 KB JS, ~109 KB gzipped), CSP injected
