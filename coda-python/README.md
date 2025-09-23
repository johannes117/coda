# Coda Python CLI

Python CLI Coding agent UI with Tokyo Night theme.

## Requirements

- Python 3.10 or higher
- [uv](https://docs.astral.sh/uv/) package manager

## Installation

Install dependencies using uv:

```bash
uv sync
```

## Running the Application

Run the CLI application:

```bash
uv run coda
```

Alternatively, you can activate the virtual environment and run directly:

```bash
source .venv/bin/activate
python -m coda.app
```

## Project Structure

- `coda/app.py` - Main application entry point
- `coda/theme.py` - Theme configuration
- `coda/styles_dark.tcss` - Dark theme styles
- `coda/styles_light.tcss` - Light theme styles