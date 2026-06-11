```bash
  ░██████    ░██████   ░███████      ░███
 ░██   ░██  ░██   ░██  ░██   ░██    ░██░██
░██        ░██     ░██ ░██    ░██  ░██  ░██
░██        ░██     ░██ ░██    ░██ ░█████████
░██        ░██     ░██ ░██    ░██ ░██    ░██
 ░██   ░██  ░██   ░██  ░██   ░██  ░██    ░██
  ░██████    ░██████   ░███████   ░██    ░██
```

# coda

coda is an AI coding-agent CLI for local code tasks. It provides an Ink-based terminal UI, streams agent activity through LangGraph/deepagents, and can use filesystem and shell tools in the current working directory.

## Features

- Interactive terminal UI built with Ink and React.
- Agent and plan modes; press `Tab` to switch between them.
- Model support for Anthropic, OpenAI, and Google.
- Local API key and model configuration storage under `~/.coda`.
- Slash commands for help, status, model selection, API key management, reviews, clearing, resetting, and quitting.
- File references with `@...`, image paste support, and long-paste placeholders.
- Tool-call rendering for shell, file, search, todo, and subagent activity.
- Optional LangSmith tracing and evaluation support.

## Requirements

- Node.js 20 or newer
- Bun

Install Bun if needed:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Setup

```bash
git clone <repo>
cd coda
bun install
```

Optional LangSmith tracing can be enabled with a `.env` file:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_api_key_here
LANGSMITH_PROJECT=coda
```

API keys for model providers are managed in the app with `/apikeys` or prompted when selecting a model whose provider key is missing.

## Development

```bash
bun run build      # Type-check and compile to dist/
bun run dev        # Run TypeScript in watch mode
bun run start      # Run the compiled CLI
bun run test       # Run Vitest, excluding evals
bun run eval       # Run LangSmith evals
bun run logs:tail  # Tail ~/.coda/logs/coda.log
```

## Linking the CLI locally

```bash
bun run build
bun link
```

Then run `coda` from any workspace.

## Usage

Start the interactive CLI:

```bash
bun run start
```

Common commands:

- `/help` - Show available commands.
- `/status` - Show workspace, model, session, and token status.
- `/model` - Switch models.
- `/apikeys` or `/keys` - Manage provider API keys.
- `/review` - Review the current branch against `main` or `master`.
- `/clear` or `/new` - Start a new conversation.
- `/reset` - Clear stored API keys and reset the app.
- `/quit` or `/exit` - Exit.

Keyboard shortcuts:

- `Tab` - Switch between agent and plan modes, or complete menu selections.
- `Esc` - Close open menus or interrupt busy work.

## Project structure

- `index.ts` - Executable entry point; loads environment variables and starts the CLI.
- `src/coda.tsx` - Ink renderer setup, terminal lifecycle handling, and stored config loading.
- `src/app/` - Core app logic: agent runner, slash commands, state store, stream processing.
- `src/agent/` - Agent graph, model factory, and system prompts. Runtime tools are provided by `deepagents`.
- `src/tui/` - Ink UI components, hooks, themes, and tool-result renderers.
- `src/tui/tools/` - UI definitions for displaying tool calls and results.
- `src/lib/` - Framework-agnostic helpers for storage, logging, diffs, file search, paste handling, and models.
- `src/types/` - Shared TypeScript types.
- `src/evals/` - LangSmith evaluation dataset and runner.
- `examples/` - Example projects for trying the agent.

See `AGENTS.md` for contributor guidelines.

## Contributing

Pull requests are welcome. Please follow the conventions in `AGENTS.md`.
