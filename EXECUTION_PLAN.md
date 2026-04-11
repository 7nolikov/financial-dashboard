# Execution Plan — Viral Launch 2026

## Audit Summary

Full technical, usability, and virality audit performed April 2026. The app was technically solid (B+ engineering) but had zero viral DNA (D virality grade). The core problem: no emotional hook before data entry, no shareable output format, generic copy that ignored the 2026 financial crisis context.

---

## Phase 1: Emotional Hook (COMPLETED)

**Goal**: Create an emotional reaction before users touch any data.

| Task                                                                 | Status | Impact                                                           |
| -------------------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| Reality Check hero banner with rotating 2026 crisis stats            | Done   | CRITICAL — First thing users see. Shock → curiosity → engagement |
| "Show Me the Average European Reality" CTA that loads wake-up preset | Done   | HIGH — One-click path to the most viral scenario                 |
| Session-based dismissal (reappears on fresh visits, not mid-session) | Done   | UX — Doesn't nag returning users                                 |

**Files**: `src/components/RealityCheck.tsx`, `src/App.tsx`

---

## Phase 2: Shareable Output (COMPLETED)

**Goal**: Give users something screenshot-friendly to share.

| Task                                                                                         | Status | Impact                                                      |
| -------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| Financial Scorecard with letter grade (A+ to F)                                              | Done   | CRITICAL — "I got a C, what did you get?" is the viral loop |
| 6-metric grid: FIRE Number, Progress, FIRE Age, Savings Rate, Peak Net Worth, Retirement Gap | Done   | HIGH — Dense, visual, provokes comparison                   |
| Dark themed card with branding footer                                                        | Done   | MEDIUM — Looks good in screenshots on any platform          |
| Side-by-side layout with FireInsights on desktop                                             | Done   | UX — Both cards visible without scrolling                   |

**Files**: `src/components/ScoreCard.tsx`, `src/App.tsx`

---

## Phase 3: 2026 Crisis Positioning (COMPLETED)

**Goal**: Anchor all messaging to 2026 financial/society problems.

| Task                                                                               | Status | Impact                                                     |
| ---------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| New "Gig Worker 2026" preset (no employer pension, variable income, high costs)    | Done   | HIGH — Represents millions in platform/gig economy         |
| Updated all viral share copy with pension gap stats, inflation data, urgency       | Done   | HIGH — "€470K retirement gap" beats "just ran the numbers" |
| Added Reddit sharing (r/personalfinance, r/fire, r/europeanfire)                   | Done   | HIGH — Direct access to 20M+ target users                  |
| Updated OG/Twitter meta tags with crisis hook                                      | Done   | MEDIUM — Better link previews drive more clicks            |
| Updated JSON-LD structured data                                                    | Done   | LOW — SEO benefit                                          |
| Urgency-driven footer CTA (dark theme, "Most people won't retire when they think") | Done   | MEDIUM — Final push to share                               |

**Files**: `src/state/store.ts`, `src/components/Share/ShareModal.tsx`, `src/components/FireInsights.tsx`, `index.html`, `src/App.tsx`

**2026 crisis themes used**:

- Pension collapse (retirement age rising, state pensions shrinking)
- Housing affordability (72% of under-35s locked out)
- AI job displacement (40% of roles at risk)
- Post-inflation purchasing power loss (-18% since 2020)
- Gig economy trap (no employer pensions, no safety net)

---

## Phase 4: Layout & UX (COMPLETED)

| Task                                         | Status | Impact                                      |
| -------------------------------------------- | ------ | ------------------------------------------- |
| Increased mobile chart height 260px → 300px  | Done   | MEDIUM — Primary value prop gets more space |
| Increased desktop chart height 300px → 340px | Done   | LOW — Marginal improvement                  |
| Updated Help modal to reference new presets  | Done   | LOW — Consistency                           |

**Files**: `src/components/Timeline/AreaChart.tsx`, `src/components/Help/HelpModal.tsx`

---

## Phase 5: Documentation (COMPLETED)

| Task                                                             | Status | Impact                                 |
| ---------------------------------------------------------------- | ------ | -------------------------------------- |
| Rewrote README.md from dev template to user-facing viral landing | Done   | HIGH — First thing GitHub visitors see |
| Removed stale `docs/ACCEPTANCE_CRITERIA.md`                      | Done   | Cleanup                                |
| Removed stale `docs/RELEASE.md`                                  | Done   | Cleanup                                |
| Removed duplicate `docs/README.md`                               | Done   | Cleanup                                |
| Created this execution plan                                      | Done   | Reference                              |

---

## Phase 6: Launch Strategy (TODO — Manual)

### Pre-Launch Checklist

- [ ] Verify production deploy at https://7nolikov.github.io/financial-dashboard/
- [ ] Test shared links render correct OG previews (use https://cards-dev.twitter.com/validator)
- [ ] Test all 6 presets load correctly
- [ ] Test share flows: X, Reddit, WhatsApp, LinkedIn, Copy Link, Download JPG
- [ ] Test mobile layout on real iPhone and Android device
- [ ] Test Reality Check banner dismiss/reappear flow

### Day 1: Seed Content

| Platform                     | Post Strategy                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Reddit r/personalfinance** | "I built a free tool to face your real retirement numbers. The average European has a €470K gap." — link to app       |
| **Reddit r/fire**            | Share Investor preset scorecard screenshot. "Built a free FIRE calculator — here's my scorecard."                     |
| **Reddit r/europeanfire**    | Share Average European preset. "This is the wake-up call the average European needs."                                 |
| **X (Twitter)**              | Personal post with own F-grade scorecard screenshot. Provocative: "Just got my financial grade. It's an F."           |
| **Hacker News (Show HN)**    | "Show HN: I built a 100-year financial life planner — open source, all local, no server" — emphasize privacy and tech |

### Day 2-3: Community Amplification

| Platform                    | Post Strategy                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **LinkedIn**                | Professional angle: "In 2026, the pension gap is €470K. I built a free tool to help people face their numbers." |
| **FIRE Facebook groups**    | Share scorecard, ask "What grade did you get?"                                                                  |
| **Finance Discord servers** | Share link with Gig Worker preset context                                                                       |
| **Product Hunt**            | Submit with "Financial Life Tracker — Face your 2026 retirement gap" tagline                                    |

### Day 4-7: Creator Outreach

| Target                                             | Pitch                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Finance TikTokers (10-15 DMs)                      | "I built a free tool that gives you a financial grade A-F. Want to react to your result on camera?" |
| Finance YouTubers                                  | "Tool generates a shareable financial scorecard — great reaction content"                           |
| Finance newsletters (Morning Brew, Finimize, etc.) | "Open source, no tracking, privacy-first FIRE tool with 2026 crisis framing"                        |

### The Viral Loop

```
Scary stat (hero banner)
  → User tries tool
    → Gets personal grade (A+ to F)
      → Screenshots scorecard
        → Shares + challenges friends
          → Friends try it → repeat
```

The **grade mechanic** is the engine. People share grades. "I got a C, what did you get?" turns a financial planning tool into a social game.

---

## Phase 7: Future Improvements (BACKLOG)

These are not blocking launch but would increase virality and retention:

| Task                                                    | Impact | Effort |
| ------------------------------------------------------- | ------ | ------ |
| Dynamic OG image (personalized preview per shared link) | HIGH   | HIGH   |
| Scorecard image export (download scorecard as PNG)      | HIGH   | LOW    |
| Currency selector (EUR/USD/GBP/etc.)                    | MEDIUM | MEDIUM |
| Dark mode toggle UI (infrastructure exists)             | LOW    | LOW    |
| E2E tests in CI pipeline                                | LOW    | LOW    |
| Focus trap for ShareModal/HelpModal (accessibility)     | MEDIUM | LOW    |
| TikTok-style vertical video export                      | HIGH   | HIGH   |
| "Compare to peers" benchmark overlay                    | HIGH   | MEDIUM |
| Guided onboarding tour for first-time users             | MEDIUM | MEDIUM |

---

## Verification

All changes verified:

- TypeScript: PASS
- ESLint: 0 errors, 0 warnings
- Unit Tests: 48/48 PASS
- Production Build: SUCCESS (337KB JS, 98KB gzipped)
