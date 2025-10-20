# Tech Stack and Rationale

- Framework: React 18 + TypeScript (Vite) for fast dev/build.
- UI: Tailwind CSS + shadcn/ui for accessible, composable components.
- Charts: Visx for performance and flexibility. Recharts adapter possible later.
- State: Zustand + immer + selectors; `zustand/middleware` for persistence and devtools.
- Persistence: Local Storage with versioned migrations.
- Testing: Vitest + RTL for unit/integration; Playwright for e2e; Hurl for HTTP flows (share image).
- Tooling: ESLint, Prettier, Makefile (PowerShell-friendly), Conventional Commits, Husky hooks.
