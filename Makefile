.PHONY: dev build test test-watch e2e lint typecheck format generate-og install

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

test-watch:
	pnpm test:watch

e2e:
	pnpm e2e

lint:
	pnpm lint

typecheck:
	pnpm typecheck

format:
	pnpm format

generate-og:
	pnpm generate-og
