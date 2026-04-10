# Workflow

- TDD cycle:
  1. Create failing test stub
  2. Implement test logic (compilation fails)
  3. Add minimal implementation (throws UnsupportedOperationException)
  4. Implement to pass tests
  5. Refactor, keep tests passing
- Conventional Commits required.
- Run tasks via pnpm (`pnpm dev|build|test|e2e|lint|typecheck|format`)
  or the cross-platform Makefile wrapper (`make dev|build|test|e2e|lint`).
- Pre-commit hook runs `lint-staged` (Prettier + ESLint) on staged files.
