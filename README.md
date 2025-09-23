# Coda

AI-powered coding agent with Tokyo Night theme. An interactive terminal UI for seamless code generation, editing, and project management.

## Features

- Tokyo Night-themed TUI interface
- AI-powered code generation and editing
- Smart file operations with ignore patterns
- Shell command execution with approval system
- Git integration for version control
- Comprehensive testing and evaluation framework
- Flexible configuration and approval settings

## Requirements

- Python 3.10 or higher
- [uv](https://docs.astral.sh/uv/) package manager
- OpenAI API key (optional but recommended)

## Quick Start

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Set up API key (optional):**
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. **Run Coda:**
   ```bash
   uv run coda
   ```

## Usage Examples

### Agent Modes

**Interactive Conversation:**
- "Add error handling to the login function"
- "Create a REST API endpoint for user registration"
- "Fix the failing tests in test_auth.py"

**Built-in Commands:**
- `/init` - Create AGENTS.md with project instructions
- `/status` - Show current session configuration
- `/approvals` - Configure what Coda can do automatically
- `/model` - Change AI model settings

## Project Structure

```
coda/
├── src/coda/              # Main package
│   ├── main.py           # CLI entry point
│   ├── ui/               # Textual TUI implementation
│   │   ├── app.py        # Main application
│   │   ├── theme.py      # Tokyo Night theme
│   │   └── styles/       # CSS files
│   ├── core/             # Core agent logic
│   │   ├── agent.py      # Task orchestration
│   │   ├── models.py     # LLM integration
│   │   ├── executor.py   # File/shell operations
│   │   └── config.py     # Configuration management
│   └── utils/            # Helper utilities
├── tests/                # Comprehensive test suite
├── docs/                 # Documentation
├── examples/             # Sample projects
└── .github/workflows/    # CI/CD
```

## Configuration

Create `~/.coda/config.toml` for customization:

```toml
model = "gpt-5"
reasoning_effort = "medium"

[approvals]
read = true      # Auto-approve file reading
write = false    # Require approval for file writes
shell = false    # Require approval for shell commands
install = false  # Require approval for package installation

ignore_patterns = [
    "*.log", "*.tmp", "__pycache__/", ".git/",
    "node_modules/", ".venv/"
]
```

## Development

**Run tests:**
```bash
uv run pytest tests/ -v
```

**Lint code:**
```bash
uv run ruff check src/ tests/
uv run ruff format src/ tests/
```

**Type checking:**
```bash
uv run mypy src/coda
```

## Documentation

- [Setup Guide](docs/setup.md) - Installation and configuration
- [Usage Guide](docs/usage.md) - Commands and conversational flow
- [Advanced Guide](docs/advanced.md) - Custom prompts and integrations

## License

MIT License - see [LICENSE](LICENSE) file for details.