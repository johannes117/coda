# Repository Guidelines

This document summarizes how to work effectively inside the coda CLI codebase. Keep the CLI responsive, testable, and idiomatic to Ink and TypeScript.

## Project Structure & Module Organization
- `index.ts` is the executable entry point and forwards to `src/coda.tsx`.
- `src/coda.tsx` wires Yargs parsing with the Ink renderer.
- TUI (Ink UI) lives under `src/tui/`:
  - `src/tui/App.tsx` main UI entry.
  - `src/tui/components/` presentational components.
  - `src/tui/state/` Zustand store for UI/session state.
  - `src/tui/commands/` slash command metadata.
- Agent logic lives under `src/agent/` (LangGraph, tools, prompts).
- Framework-agnostic helpers live under `src/lib/` (logger, storage, diff, time).
- App configuration and constants under `src/config/` (e.g., `models.ts`).
- Shared types live under `src/types/`.
- Shared setup for tests sits in `test-setup.ts`; Vitest config resides in `vitest.config.ts`.
- Transpiled JavaScript lands in `dist/`; treat it as a build artifact only.

## Build, Test, and Development Commands
- `bun install` syncs dependencies and keeps `bun.lock` authoritative.
- `bun run build` runs `tsc` then `tsc-alias` and emits ESM output to `dist/`.
- `bun run dev` keeps TypeScript in watch mode for local iteration.
- `bun run start` executes the compiled CLI from `dist/index.js`.
- `bun run test` invokes `vitest run` with the jsdom environment and shared setup file.

Path aliases are available in both `tsc` and Vitest via `tsc-alias` and Vite resolve aliases:
- `@tui/*` → `src/tui/*`
- `@agent/*` → `src/agent/*`
- `@lib/*` → `src/lib/*`
- `@config/*` → `src/config/*`
- `@types` → `src/types/index.ts`

## Coding Style & Naming Conventions
- Stick to strict TypeScript, ES2022 modules, and 2-space indentation.
- Prefer named exports; reserve default exports for CLI entry files only.
- Components and hooks follow React conventions: PascalCase for components, camelCase for functions and variables, UPPER_SNAKE for constants.
- Ban useEffect; use Zustand for shared state and React Query for data fetching.
- Keep terminal output ASCII, wrap messaging for narrow terminals, and document non-obvious UI flows inline with brief comments.

## Testing Guidelines
- Place `*.test.ts` or `*.test.tsx` beside the code they verify (e.g., `src/ui/__tests__/HeaderBar.test.tsx`).
- Use Vitest with `ink-testing-library` and `@testing-library/react` helpers to validate Ink output.
- Cover argument parsing, exit codes, and message rendering; update or add snapshots when UI framing changes.
- Ensure new UI surfaces still render within typical terminal widths (80x24) during tests. (We are not adding UI Tests right now due to rapidly changing UI during development)

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`) as seen in recent history; keep subjects under ~72 characters.
- Scope prefixes like `feat(ui):` help reviewers connect changes to interface layers.
- Pull requests should include a behavior summary, testing notes, linked issues, and terminal screenshots/gifs for notable UI updates.
- Flag breaking CLI changes clearly and update this guide whenever contributor expectations shift.
