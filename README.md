```bash
  ░██████    ░██████   ░███████      ░███    
 ░██   ░██  ░██   ░██  ░██   ░██    ░██░██   
░██        ░██     ░██ ░██    ░██  ░██  ░██  
░██        ░██     ░██ ░██    ░██ ░█████████ 
░██        ░██     ░██ ░██    ░██ ░██    ░██ 
 ░██   ░██  ░██   ░██  ░██   ░██  ░██    ░██ 
  ░██████    ░██████   ░███████   ░██    ░██ 
```
AI coding agent CLI: Interact with LLM (via OpenRouter) for filesystem ops, shell commands, and code tasks. Built with Ink (TUI), LangGraph (agent graph), TypeScript.

## Setup

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Clone: `git clone <repo> && cd coda`
3. Deps: `bun install`

## Dev

- Build: `bun run build`
- Watch: `bun run dev`
- Run: `bun run start`
- Test: `bun run test`
- Logs (debug): `bun run logs:tail` (tail `~/.coda/logs/coda.log` in separate terminal)

## Usage

Interactive: `bun run start` (prompt for OpenRouter API key on first run).

Non-interactive: `bun run start -p "your prompt"`.

Commands: `/status`, `/model`, `/reset`, `/clear`, `/quit`. Tab: switch modes (agent/plan). Esc: interrupt/exit.

## Structure

- `src/coda.tsx`: Entry, Yargs + Ink.
- `src/agent/`: LangGraph agent, tools (fs, shell).
- `src/ui/`: TUI components.
- `src/utils/`: Storage, logger.

See `AGENTS.md` for guidelines.