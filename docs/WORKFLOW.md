# Workflow

- TDD cycle:
  1) Create failing test stub
  2) Implement test logic (compilation fails)
  3) Add minimal implementation (throws UnsupportedOperationException)
  4) Implement to pass tests
  5) Refactor, keep tests passing
- Conventional Commits required.
- Use Makefile (PowerShell): `make dev|build|test|e2e|lint|format|docs`.
- Track progress in `docs/PROGRESS.md`.
