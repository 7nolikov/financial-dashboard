# Testing Strategy

- Unit: Vitest + React Testing Library.
- Integration: component interactions, selectors, store behavior.
- E2E: Playwright (dev server at http://localhost:5173).
- HTTP: Hurl for share/download flows (html2canvas capture service if added).
- Reports: Allure (planned) with human-readable names, tags, history.
- TDD: Red → implement → Green → Refactor per user rules.

Commands:
- `make test` – run unit tests
- `make e2e` – run Playwright
- `make dev` – local dev server
