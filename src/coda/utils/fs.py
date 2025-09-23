"""File system utilities for Coda."""

import fnmatch
from pathlib import Path
from typing import List


def should_ignore_path(path: Path, ignore_patterns: List[str]) -> bool:
    """Check if a path should be ignored based on patterns."""
    path_str = str(path)
    path_name = path.name

    for pattern in ignore_patterns:
        # Check if pattern matches the full path or just the filename
        if fnmatch.fnmatch(path_str, pattern) or fnmatch.fnmatch(path_name, pattern):
            return True

        # Check if any parent directory matches the pattern
        for parent in path.parents:
            if fnmatch.fnmatch(parent.name, pattern.rstrip("/")):
                return True

    return False


def load_codaignore(workspace: Path) -> List[str]:
    """Load ignore patterns from .codaignore file."""
    ignore_file = workspace / ".codaignore"
    if not ignore_file.exists():
        return []

    try:
        patterns = []
        for line in ignore_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)
        return patterns
    except Exception:
        return []


def find_project_files(workspace: Path, extensions: List[str] = None) -> List[Path]:
    """Find relevant project files, excluding ignored paths."""
    if extensions is None:
        extensions = [".py", ".js", ".ts", ".jsx", ".tsx", ".md", ".toml", ".yaml", ".yml", ".json"]

    ignore_patterns = [
        "__pycache__/",
        ".git/",
        "node_modules/",
        ".venv/",
        "venv/",
        "*.pyc",
        "*.log",
    ]

    # Load additional patterns from .codaignore
    ignore_patterns.extend(load_codaignore(workspace))

    files = []
    for ext in extensions:
        for file_path in workspace.rglob(f"*{ext}"):
            if not should_ignore_path(file_path, ignore_patterns):
                files.append(file_path)

    return sorted(files)


def get_file_info(file_path: Path) -> dict:
    """Get information about a file."""
    try:
        stat = file_path.stat()
        return {
            "size": stat.st_size,
            "modified": stat.st_mtime,
            "is_file": file_path.is_file(),
            "is_dir": file_path.is_dir(),
            "exists": file_path.exists(),
        }
    except Exception:
        return {
            "size": 0,
            "modified": 0,
            "is_file": False,
            "is_dir": False,
            "exists": False,
        }