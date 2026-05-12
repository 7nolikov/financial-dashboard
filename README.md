# Financial Life Tracker

A local-first calculator for mapping income, expenses, investments, debt, and retirement on a 100-year timeline. Runs entirely in the browser — no server, no account, all state in `localStorage`.

Live: https://7nolikov.dev/financial-dashboard/

## Background

I work in backend / distributed systems (Go, Java). This was a learning project on the frontend side — an exercise in shipping a non-trivial React + TypeScript + Visx app end-to-end with AI assistance for the parts of the React/Tailwind/Visx idiom I didn't already know. The local-first constraint (no backend, ever) kept the scope honest and the architecture interesting.

Not a finished product. A working, deployed sandbox.

## What it does

- 100-year monthly timeline with income, expenses, investments, debt
- FIRE calculator (time-to-financial-independence projection)
- Inflation modeling — nominal vs real
- Six presets covering common financial profiles (worker, investor, businessman, loaner, gig worker, average European)
- Export / share results

## Tech stack

| Layer     | Tech                                 |
| --------- | ------------------------------------ |
| Framework | React 18 + TypeScript                |
| Build     | Vite                                 |
| Styling   | Tailwind CSS                         |
| Charts    | Visx (D3-based)                      |
| State     | Zustand, persisted to `localStorage` |
| Testing   | Vitest + Playwright                  |
| Deploy    | GitHub Pages via Actions             |

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

See [`docs/`](docs/) for architecture, calculation, and state schema notes.

## License

MIT. Planning tool, not financial advice.
