# Execution Plan — Viral Launch 2026

## Audit Summary

Full technical, usability, and virality audit performed April 2026 (two passes).

**Pass 1 findings**: Solid engineering (B+), zero viral DNA (D). No emotional hook, no shareable output, generic copy ignoring 2026 financial crisis context.

**Pass 2 findings**: UI/UX hierarchy broken — 5 de facto levels instead of 3, significant duplication between FireInsights and ScoreCard (3 of 6 metrics were identical), rogue 6-KPI row embedded inside the chart creating a hidden sub-level, chart rendering quality poor (near-invisible grid, no FIRE date marker, thin lines, no currency prefix on Y-axis).

---

## Phase 1: Emotional Hook (DONE)

**Goal**: Create an emotional reaction before users touch any data.

| Task                                                            | Status | Impact                                                           |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| Reality Check hero banner with rotating 2026 crisis stats       | Done   | CRITICAL — First thing users see. Shock → curiosity → engagement |
| "Show Me the Average European Reality" CTA loads wake-up preset | Done   | HIGH — One-click path to the most viral scenario                 |
| Session-based dismissal                                         | Done   | UX — Doesn't nag returning users in same session                 |

**Files**: `src/components/RealityCheck.tsx`, `src/App.tsx`

---

## Phase 2: Shareable Output (DONE)

**Goal**: Give users something screenshot-friendly to share, driven by a grade mechanic.

| Task                                                               | Status | Notes                                                |
| ------------------------------------------------------------------ | ------ | ---------------------------------------------------- |
| OverviewCard with letter grade (A+ to F)                           | Done   | Replaces FireInsights + ScoreCard pair — see Phase 5 |
| 4-metric grid: FIRE Number, FIRE Age, Savings Rate, Retirement Gap | Done   | No duplication, maximum information density          |
| Progress bar — single source of truth                              | Done   | One bar, clean                                       |
| Share on X (tweet) inline in card header                           | Done   | Direct from primary card                             |

**Files**: `src/components/OverviewCard.tsx`

---

## Phase 3: 2026 Crisis Positioning (DONE)

**Goal**: Anchor all messaging to 2026 financial/society problems that resonate.

| Task                                                                         | Status | Impact                                          |
| ---------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| Gig Worker 2026 preset (no employer pension, variable income)                | Done   | HIGH — Millions in platform economy             |
| Updated all viral share copy with pension gap stats and urgency              | Done   | HIGH — "€470K gap" beats "just ran the numbers" |
| Added Reddit sharing (r/personalfinance, r/fire, r/europeanfire)             | Done   | HIGH — 20M+ target users                        |
| Updated OG/Twitter meta tags with crisis hook                                | Done   | MEDIUM                                          |
| Urgency-driven footer CTA (dark, "Most people won't retire when they think") | Done   | MEDIUM                                          |

**2026 crisis themes used**:

- Pension collapse (retirement age rising, state pensions shrinking)
- Housing unaffordability (72% of under-35s locked out)
- AI job displacement (40% of roles at risk)
- Post-inflation purchasing power loss (-18% since 2020)
- Gig economy trap (no employer pensions, no safety net)

**Files**: `src/state/store.ts`, `src/components/Share/ShareModal.tsx`, `src/components/FireInsights.tsx`, `index.html`, `src/App.tsx`

---

## Phase 4: Layout & UX (DONE)

| Task                                         | Status | Impact |
| -------------------------------------------- | ------ | ------ |
| Increased mobile chart height 260px → 300px  | Done   | MEDIUM |
| Increased desktop chart height 300px → 340px | Done   | LOW    |
| Updated Help modal to reference new presets  | Done   | LOW    |

---

## Phase 5: UI/UX Hierarchy Fix (DONE — revised in Phase 10)

**Problem**: 5 de facto information levels instead of the intended 3. FireInsights and ScoreCard had 3 duplicate metrics. The AreaChart had a 6-KPI row that created a hidden sub-level (Level 2.5).

**Solution**: True 3-level architecture (see Phase 10 for the final Level 1 design).

| Task                                                              | Status | Impact                                    |
| ----------------------------------------------------------------- | ------ | ----------------------------------------- |
| Merged FireInsights + ScoreCard → OverviewCard                    | Done   | CRITICAL — eliminates all duplication     |
| Removed 6-KPI row from AreaChart                                  | Done   | HIGH — chart is clean, no rogue sub-level |
| Deleted orphaned Kpi, sum, getSafetyStatus helpers from AreaChart | Done   | Cleanup                                   |

---

## Phase 6: Chart Quality (DONE)

**Problem**: Grid nearly invisible (`#f1f5f9`), area fills washed out (20% opacity flat color), Net Worth line 1px, no FIRE date on chart, Y-axis labels no currency prefix, extremum labels 8px unreadable, background gradient imperceptible.

| Fix              | Before                    | After                             |
| ---------------- | ------------------------- | --------------------------------- |
| Grid lines       | `#f1f5f9` (invisible)     | `#e2e8f0` (visible)               |
| Area fills       | Flat 20% opacity          | Gradient: 35%→5% opacity          |
| Area strokes     | 1px default               | 1.5px                             |
| Net Worth line   | 1px default               | 2.5px (dominant, readable)        |
| Safety line      | 1px                       | 1.5px                             |
| FIRE date marker | Not on chart              | Amber vertical line + label badge |
| Y-axis labels    | `1.2M`                    | `€1.2M`                           |
| Extremum labels  | 8px, unreadable           | 9–10px with 3px white stroke      |
| Chart background | White→#f8fafc (invisible) | #f8faff→#f1f5f9 (subtle depth)    |

**Files**: `src/components/Timeline/AreaChart.tsx`

---

## Phase 7: Documentation (DONE)

| Task                                                       | Status |
| ---------------------------------------------------------- | ------ |
| Rewrote README.md (user-facing, not dev template)          | Done   |
| Removed stale `docs/ACCEPTANCE_CRITERIA.md`                | Done   |
| Removed stale `docs/RELEASE.md`                            | Done   |
| Removed duplicate `docs/README.md`                         | Done   |
| Updated `docs/ARCHITECTURE.md` with true 3-level hierarchy | Done   |
| Created this execution plan                                | Done   |

---

## Phase 8: Launch Strategy (TODO — Manual)

### Pre-Launch Checklist

- [ ] Verify production deploy at https://7nolikov.github.io/financial-dashboard/
- [ ] Test OG previews (use https://cards-dev.twitter.com/validator)
- [ ] Test all 6 presets load correctly
- [ ] Test share flows: X, Reddit, WhatsApp, LinkedIn, Copy Link, Download JPG
- [ ] Test mobile layout on real iPhone + Android
- [ ] Test Reality Check banner dismiss/reappear (session-based)
- [ ] Test FIRE date line appears on chart when FIRE is reachable
- [ ] Test OverviewCard grade changes correctly across all grade thresholds

### Day 1: Seed Content

| Platform                     | Post Strategy                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Reddit r/personalfinance** | "I built a free tool to face your real retirement numbers. The average European has a €470K gap."          |
| **Reddit r/fire**            | Share Investor preset OverviewCard screenshot. "Built this FIRE calculator — got an A. What's your grade?" |
| **Reddit r/europeanfire**    | Share Average European preset. "This is the wake-up call the average European needs."                      |
| **X (Twitter)**              | Personal post with own grade screenshot. "Just got my financial grade. It's a C."                          |
| **Hacker News (Show HN)**    | "Show HN: I built a 100-year financial life planner — open source, all local, no server"                   |

### Day 2-3: Community Amplification

| Platform                 | Post Strategy                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| **LinkedIn**             | "In 2026, the pension gap is €470K. I built a free tool to help people face their numbers." |
| **FIRE Facebook groups** | Share grade card, ask "What grade did you get?"                                             |
| **Product Hunt**         | Submit with "Financial Life Tracker — Face your 2026 retirement gap" tagline                |

### Day 4-7: Creator Outreach

| Target                        | Pitch                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Finance TikTokers (10-15 DMs) | "Free tool gives you a financial grade A-F. Want to react to your result on camera?" |
| Finance YouTubers             | "Tool generates a shareable grade — great reaction content"                          |
| Finance newsletters           | "Open source, privacy-first FIRE tool with 2026 crisis framing"                      |

### The Viral Loop

```
Scary stat (hero banner)
  → User tries tool
    → Gets letter grade (A+ to F)
      → Screenshots grade card
        → "I got a C, what did you get?"
          → Friends try it → repeat
```

---

## Phase 10: Rebalance — Normal People + FIRE (DONE)

**Problem**: Phase 5 over-rotated toward FIRE. The OverviewCard showed only FIRE-derived metrics (FIRE Number, FIRE Age, Savings Rate, Retirement Gap, Grade). Normal users — the 90% who don't know or care about FIRE — saw nothing useful at Level 1. The app is called "Financial Life Tracker", not "FIRE Calculator". Worse: `OverviewCard` returned `null` when no expenses were configured, leaving Level 1 completely empty.

**Critical insight**: The 6 financial KPIs (Income, Expenses, Net Worth, Investments, Loans, Cash Flow) are what **every** user cares about. FIRE grade is the viral mechanic — important for sharing, but it shouldn't replace the core financial dashboard.

**Solution**: Dual-purpose OverviewCard.

```
Level 1 — Overview (OverviewCard — never null)
  Header: "Financial Snapshot" + age + Share button
  Top row: 6 KPIs (Income | Expenses | Net Worth | Investments | Loans | Cash Flow)
    — 3×2 grid on mobile, 6-across on desktop
    — Color-coded dots matching chart legend colors
    — Always visible regardless of configuration state
  Bottom section (when expenses > 0):
    FIRE Grade badge + FIRE metrics inline (target, age, savings rate)
    Progress bar

Level 2 — Timeline (AreaChart)
  Chart header: title + mode badge + legend
  SVG: areas, lines, FIRE date marker, zones, milestones, hover tooltip
  Chart footer: Reset Zoom | instructions

Level 3 — Configuration (collapsible)
  Data Entry tabs | Settings tab
```

| Task                                                     | Status | Impact                                           |
| -------------------------------------------------------- | ------ | ------------------------------------------------ |
| Restored 6 financial KPIs to OverviewCard top row        | Done   | CRITICAL — dashboard serves ALL users again      |
| FIRE grade + progress bar moved to bottom section        | Done   | HIGH — viral mechanic preserved but not dominant |
| Fixed null-return bug (card always renders now)          | Done   | HIGH — Level 1 never empty                       |
| KPI dots match chart legend colors for visual continuity | Done   | MEDIUM — connects overview to timeline           |
| Deleted orphaned FireInsights.tsx and ScoreCard.tsx      | Done   | Cleanup                                          |

**Files**: `src/components/OverviewCard.tsx`

---

## Phase 11: Font Audit & Chart Quality Pass 2 (DONE)

### Font Audit

**Verdict**: System font stack (Tailwind default) is the correct choice — zero load time, no FOIT/FOUT, native feel on every platform. No Google Font dependency needed.

| Issue                                               | Fix                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| SVG chart text doesn't inherit `tnum` from body CSS | Added `fontVariantNumeric: 'tabular-nums'` to Y-axis and X-axis labels |
| Y-axis monospace font had no tabular alignment      | Combined `ui-monospace` with explicit tabular-nums style               |

### Chart Quality — Critical Fixes

| Issue                                       | Before                                                     | After                                                                              |
| ------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Loans in legend but missing from chart**  | Legend showed Loans, chart didn't render them              | Added Loans as dashed amber line (`#d97706`, dash `4 3`)                           |
| **No retirement age marker**                | Users configure retirement but can't see it                | Slate vertical line + "Retire 65" badge at bottom                                  |
| **Milestones nearly invisible**             | 9px text, emoji 📍 prefix, thin dashed line                | Indigo badge (pill shape) with white text, dot marker, 10px font                   |
| **FIRE badge too small**                    | 44×16px, 9px text                                          | 56×20px, 11px text                                                                 |
| **Danger zones invisible**                  | 6% opacity                                                 | 10% opacity                                                                        |
| **Warning zones invisible**                 | 7% opacity                                                 | 10% opacity                                                                        |
| **Color conflicts**                         | Loans amber ≈ Safety orange (hard to distinguish)          | Loans: amber-600 `#d97706` dashed `4 3`; Safety: orange-500 `#f97316` dotted `2 2` |
| **Tooltip color mismatch**                  | Loans used `text-yellow-600` (different from chart)        | Fixed to `text-amber-600` matching chart                                           |
| **Legend missing Safety**                   | 5 items in legend, 6 series on chart                       | Added Safety with orange dot                                                       |
| **Legend doesn't distinguish line vs area** | All shown as solid squares                                 | Dashed series (Loans, Safety) shown with dashed indicator                          |
| **Area overlap obscures data**              | Income→Expenses→Investments (investments cover everything) | Investments first (back), then Income, then Expenses (front)                       |

**Files**: `src/components/Timeline/AreaChart.tsx`

---

## Phase 12: Auto-Derived Milestones + QuickStart (DONE)

### Problem: Manual milestones were broken

1. **No delete** — once added, permanent until preset reload or clear-all
2. **Accidental triggers** — every click/tap on chart opened milestone dialog
3. **Overlap pushed badges off-screen** — collision resolver pushed down with no bottom bound
4. **Disconnected from data** — manual labels had no link to actual income/expense/loan entries
5. **Preset milestones duplicated data** — "First Job" at age 22 was just restating the income start date

### Solution: Auto-derive milestones from data entries

Milestones are now computed from the actual financial data:

- **Income starts/ends** → labeled with income name (e.g. "Senior Developer", "Employment ends")
- **Expense starts** (if not from age 0) → labeled with expense name
- **Investment starts** → labeled with investment name
- **Loan starts/ends** → labeled with loan name (e.g. "Mortgage", "Mortgage paid off")
- Close milestones (<6 months apart) are merged into a single badge

Removed:

- Click-to-add milestone UI (onClick handler, input dialog, touch tap handler)
- `addMilestone` store action
- Hardcoded milestone arrays from all 6 presets
- `Milestone` type kept in CoreState for localStorage backwards compatibility only

### QuickStart strip

Added a QuickStart component that appears between OverviewCard and Chart when no data is entered (both incomes and expenses empty). Shows 6 preset buttons + "Start from scratch" link that opens config panel.

| Task                                                        | Status | Impact                               |
| ----------------------------------------------------------- | ------ | ------------------------------------ |
| `deriveMilestones()` function computes milestones from data | Done   | CRITICAL — milestones now meaningful |
| Removed click-to-add UI from AreaChart                      | Done   | HIGH — no more accidental dialogs    |
| Removed `addMilestone` from store                           | Done   | Cleanup                              |
| Emptied all preset milestone arrays                         | Done   | Cleanup — derived from data now      |
| Removed test reference to `addMilestone`                    | Done   | Cleanup                              |
| Label truncation (max 20 chars) prevents overflow           | Done   | MEDIUM — prevents SVG text blowout   |
| Overlap resolver pushes upward with top clamp               | Done   | MEDIUM — badges stay inside chart    |
| QuickStart strip with preset buttons                        | Done   | HIGH — onboarding for empty state    |

**Files**: `src/components/Timeline/AreaChart.tsx`, `src/state/store.ts`, `src/components/QuickStart.tsx`, `src/App.tsx`, `tests/state/inflation-mode.test.ts`

---

## Phase 9: Future Improvements (BACKLOG)

| Task                                                  | Impact | Effort |
| ----------------------------------------------------- | ------ | ------ |
| Scorecard image export (download OverviewCard as PNG) | HIGH   | LOW    |
| Dynamic OG image per shared link                      | HIGH   | HIGH   |
| Currency selector (EUR/USD/GBP) for global reach      | MEDIUM | MEDIUM |
| Dark mode toggle UI (infrastructure exists)           | LOW    | LOW    |
| E2E tests in CI pipeline                              | LOW    | LOW    |
| Focus trap for ShareModal/HelpModal (Radix Dialog)    | MEDIUM | LOW    |
| "Compare to peers" benchmark overlay                  | HIGH   | MEDIUM |
| Guided onboarding tour for first-time users           | MEDIUM | MEDIUM |
| TikTok-style vertical video export                    | HIGH   | HIGH   |

---

## Verification (Pass 5 — Phase 12)

- TypeScript: **PASS** (0 errors)
- ESLint: **PASS** (0 errors, 0 warnings)
- Unit Tests: **48/48 PASS**
- Production Build: **SUCCESS** (333KB JS, 98KB gzipped — smaller after removing dead milestone code)
