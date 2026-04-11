# Financial Life Tracker

**The average European has a €470K retirement gap. Do you know yours?**

Map your entire financial life — income, expenses, investments, debt, and retirement — in one interactive chart. See exactly when you'll reach financial independence, or what's missing.

**[Try it now](https://7nolikov.github.io/financial-dashboard/)** — 100% free, zero signup, data never leaves your browser.

---

## Why This Exists

In 2026:

- **72%** of under-35s in Europe can't afford a home
- **40%** of jobs are at risk from AI automation by 2030
- Real purchasing power is **down 18%** since 2020
- State pensions are shrinking while retirement ages climb past 67

Most people don't know their number. This tool shows you yours in 60 seconds.

## What It Does

- **100-year financial timeline** at month-level precision
- **FIRE calculator** — when (or if) you'll reach financial independence
- **Financial Scorecard** — a shareable grade (A+ to F) based on your trajectory
- **6 realistic presets** — Worker, Investor, Businessman, Loaner, Gig Worker 2026, Average European
- **Inflation modeling** — nominal vs. real (inflation-adjusted) projections
- **Wealth protection warnings** — alerts when your plan has dangerous gaps
- **Share & challenge** — share your results on X, Reddit, WhatsApp, LinkedIn

## Privacy

All data stays in your browser. No accounts. No servers. No tracking. The entire app runs locally using `localStorage`. You can verify this — it's open source.

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Framework | React 18 + TypeScript               |
| Build     | Vite                                |
| Styling   | Tailwind CSS                        |
| Charts    | Visx (D3-based)                     |
| State     | Zustand (persisted to localStorage) |
| Testing   | Vitest + Playwright                 |
| Deploy    | GitHub Pages via GitHub Actions     |

## Development

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm test           # Run unit tests
pnpm lint           # Lint
pnpm typecheck      # TypeScript check
```

See [`docs/`](docs/) for architecture, calculations, and state schema documentation.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Use conventional commits
4. Ensure `pnpm lint && pnpm typecheck && pnpm test` pass
5. Open a PR

## License

MIT

---

**Disclaimer**: This tool is for planning purposes only and does not constitute financial advice. Consult a qualified financial advisor for important financial decisions.
