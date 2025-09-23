#!/usr/bin/env python3
"""Main CLI entry point for Coda agent."""

import argparse
from pathlib import Path

from coda.ui.app import CodaApp
from coda import __version__


def cli() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="coda",
        description="AI-powered coding agent with Tokyo Night theme",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"coda {__version__}",
    )
    parser.add_argument(
        "--config",
        type=Path,
        help="Path to config file (default: ~/.coda/config.toml)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )

    args = parser.parse_args()

    # Launch TUI app
    app = CodaApp(config_path=args.config, debug=args.debug)
    app.run()


if __name__ == "__main__":
    cli()