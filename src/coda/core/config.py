"""Configuration management for Coda agent."""

import os
import tomllib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class CodaConfig:
    """Configuration for Coda agent."""

    model: str = "gpt-5"
    reasoning_effort: str = "medium"

    # Approval settings
    auto_approve_read: bool = True
    auto_approve_write: bool = False
    auto_approve_shell: bool = False
    auto_approve_install: bool = False

    # File patterns to ignore
    ignore_patterns: List[str] = field(default_factory=lambda: [
        "*.log",
        "*.tmp",
        "__pycache__/",
        ".git/",
        "node_modules/",
        ".venv/",
        "venv/",
    ])

    # API keys
    openai_api_key: Optional[str] = None

    @classmethod
    def load(cls, config_path: Optional[Path] = None) -> "CodaConfig":
        """Load configuration from file."""
        if config_path is None:
            config_path = Path.home() / ".coda" / "config.toml"

        config = cls()

        # Load from environment variables
        config.openai_api_key = os.getenv("OPENAI_API_KEY")

        # Load from config file if it exists
        if config_path.exists():
            try:
                with open(config_path, "rb") as f:
                    data = tomllib.load(f)

                if "model" in data:
                    config.model = data["model"]
                if "reasoning_effort" in data:
                    config.reasoning_effort = data["reasoning_effort"]

                # Approval settings
                approvals = data.get("approvals", {})
                config.auto_approve_read = approvals.get("read", config.auto_approve_read)
                config.auto_approve_write = approvals.get("write", config.auto_approve_write)
                config.auto_approve_shell = approvals.get("shell", config.auto_approve_shell)
                config.auto_approve_install = approvals.get("install", config.auto_approve_install)

                # Ignore patterns
                if "ignore_patterns" in data:
                    config.ignore_patterns = data["ignore_patterns"]

                # API keys
                if "openai_api_key" in data:
                    config.openai_api_key = data["openai_api_key"]

            except Exception as e:
                print(f"Warning: Failed to load config from {config_path}: {e}")

        return config

    def save(self, config_path: Optional[Path] = None) -> None:
        """Save configuration to file."""
        if config_path is None:
            config_path = Path.home() / ".coda" / "config.toml"

        config_path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "model": self.model,
            "reasoning_effort": self.reasoning_effort,
            "approvals": {
                "read": self.auto_approve_read,
                "write": self.auto_approve_write,
                "shell": self.auto_approve_shell,
                "install": self.auto_approve_install,
            },
            "ignore_patterns": self.ignore_patterns,
        }

        if self.openai_api_key:
            data["openai_api_key"] = self.openai_api_key

        import tomli_w
        with open(config_path, "wb") as f:
            tomli_w.dump(data, f)