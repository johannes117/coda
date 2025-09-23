# Coda Setup Guide

This guide walks you through setting up Coda, the AI-powered coding agent.

## Prerequisites

- Python 3.10 or higher
- [uv](https://docs.astral.sh/uv/) package manager
- OpenAI API key (optional but recommended)

## Installation

1. **Clone the repository** (or install from PyPI when available):
   ```bash
   git clone <repository-url>
   cd coda
   ```

2. **Install dependencies**:
   ```bash
   uv sync
   ```

3. **Install development dependencies** (optional):
   ```bash
   uv sync --extra dev
   ```

## Configuration

### API Keys

Coda can work with OpenAI's GPT models. Set your API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or create a configuration file at `~/.coda/config.toml`:

```toml
openai_api_key = "your-api-key-here"
```

### Configuration File

Create `~/.coda/config.toml` to customize Coda's behavior:

```toml
# Model configuration
model = "gpt-4o"
reasoning_effort = "medium"  # low, medium, high

# Approval settings
[approvals]
read = true      # Auto-approve file reading
write = false    # Require approval for file writes
shell = false    # Require approval for shell commands
install = false  # Require approval for package installation

# File patterns to ignore
ignore_patterns = [
    "*.log",
    "*.tmp",
    "__pycache__/",
    ".git/",
    "node_modules/",
    ".venv/",
    "venv/",
]
```

### .codaignore File

Create a `.codaignore` file in your project root to specify additional files/directories that Coda should ignore:

```
# Ignore logs
logs/
*.log

# Ignore build artifacts
dist/
build/

# Ignore sensitive files
.env
secrets.json
```

## Running Coda

Start the interactive TUI:

```bash
uv run coda
```

Or if you have the environment activated:

```bash
coda
```

## First Time Setup

1. Run Coda in your project directory
2. Use the `/init` command to create an `AGENTS.md` file with project-specific instructions
3. Configure approval settings with `/approvals`
4. Check your session status with `/status`

## Troubleshooting

### Common Issues

**"OpenAI client not available"**
- Install the openai package: `uv add openai`
- Set your API key as described above

**"Permission denied" errors**
- Check your file permissions
- Ensure Coda has access to your project directory
- Review your `.codaignore` patterns

**Theme not loading correctly**
- Ensure your terminal supports 256 colors
- Try toggling theme with the `t` key

### Getting Help

- Use `/help` in the application
- Check the documentation in the `docs/` directory
- Report issues on the project repository