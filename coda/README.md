# coda

AI code agent TUI built with OpenTUI.

## Install

```bash
bun install
```

## Run

```bash
bun run src/index.tsx
```

Initial view: Welcome screen with sidebar commands.

Query view: Dummy code generation response in main editor (toggle via state for testing; add input handler for real).

Theme: Tokyo Night dark integrated via color props (assumes OpenTUI Text/Box support `color`/`bg`).

Edge: No real input/editor yet—use Text for dummy. Extend with OpenTUI Input for query handling. Syntax highlight via nested colored Text spans.