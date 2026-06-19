# Execution Plan — Viral Launch 2026

Status log + open work for the Financial Life Tracker. Granular before/after
notes that only restate the current code have been dropped; the git history
holds those.

## Information architecture (current)

A single guided 1 → 2 → 3 journey, entered through an always-visible scenario
switcher. Section headers are visible and numbered so attention flows from
high-level overview to detail.

```
Start here — PresetBar (always visible)
  6 preset chips (active highlighted) + "Start fresh"; shows "Custom plan"
  once the user edits anything. Tracked via store.activePreset.
Level 1 — Your snapshot (OverviewCard, never null)
  6 KPIs (Income | Expenses | Net Worth | Investments | Loans | Cash Flow)
  + FIRE grade, target, age, savings rate, progress bar (when expenses > 0)
Level 2 — Your timeline (AreaChart)
  Areas + lines, FIRE & retirement markers, danger/warning zones,
  derived milestones, hover/tap tooltip; pinch/scroll zoom, pan
Level 3 — Fine-tune your plan (collapsible)
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

## Phase 15: Onboarding & customer-journey redesign (DONE)

The layout had no clear path: the preset selector was buried in the Level-3 Data
Entry panel, the QuickStart strip only appeared in the empty state, and the three
section headers were `sr-only` (invisible), so there was no visible 1 → 2 → 3 flow.

| Change                                             | Detail                                                                                                                                                                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Always-visible scenario switcher** (`PresetBar`) | New "Start here" block at the top of the journey: 6 preset chips with the active one highlighted, a "Start fresh" action, and a "Custom plan" badge once the user edits. Replaces the buried `<select>` and the empty-only QuickStart. |
| **`store.activePreset`**                           | Tracks the loaded preset; flips to `'custom'` on any edit (UI-only, not persisted). Drives the switcher's highlight.                                                                                                                   |
| **Visible numbered section headers**               | Level 1/2/3 now have on-screen numbered badges + titles + subtitles ("Your snapshot" → "Your timeline" → "Fine-tune your plan"), so attention flows top-to-bottom from overview to detail.                                             |
| **Removed redundancy**                             | Deleted `QuickStart.tsx`; removed the preset `<select>` from `DataEntry/Panel.tsx` (now points to the scenario bar).                                                                                                                   |

Verified with Playwright at 1280px and 390px: switching presets moves the highlight, and editing any value surfaces the "Custom plan" badge.

**Files**: `src/components/PresetBar.tsx` (new), `src/App.tsx`, `src/state/store.ts`, `src/components/DataEntry/Panel.tsx`, `tests/state/inflation-mode.test.ts`; removed `src/components/QuickStart.tsx`.

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

## Verification (Pass 7 — June 2026, incl. Phase 15)

- TypeScript: **PASS** · ESLint: **PASS** (0/0)
- Unit tests: **57/57 PASS** (9 security/validation tests)
- Production build: **SUCCESS** (~373 KB JS, ~109 KB gzipped), CSP injected
- Layout verified visually (Playwright) at desktop 1280px and mobile 390px; preset switching + custom-state confirmed
