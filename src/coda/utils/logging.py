"""Rich logging utilities for Coda."""

import logging
import sys
from typing import Optional

from rich.console import Console
from rich.logging import RichHandler
from rich.text import Text


def setup_logging(level: str = "INFO", debug: bool = False) -> logging.Logger:
    """Set up rich logging for Coda."""
    console = Console(stderr=True)

    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )

    logger = logging.getLogger("coda")

    if debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")

    return logger


def log_action(action: str, target: str, status: str = "info") -> None:
    """Log an action with rich formatting."""
    logger = logging.getLogger("coda")

    colors = {
        "info": "blue",
        "success": "green",
        "warning": "yellow",
        "error": "red",
    }

    color = colors.get(status, "white")
    logger.info(f"[{color}]{action}[/{color}] {target}")


def log_file_operation(operation: str, file_path: str, success: bool = True) -> None:
    """Log a file operation."""
    status = "success" if success else "error"
    log_action(operation, file_path, status)


def log_shell_command(command: str, return_code: int) -> None:
    """Log a shell command execution."""
    status = "success" if return_code == 0 else "error"
    log_action("SHELL", command, status)