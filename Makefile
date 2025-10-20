SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

test-ui:
	pnpm test:ui

e2e:
	pnpm e2e

lint:
	pnpm lint

format:
	pnpm format

docs:
	pnpm docs

prepare:
	pnpm prepare



