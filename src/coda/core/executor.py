"""Action executor for Coda agent."""

import os
import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

try:
    import git
    GIT_AVAILABLE = True
except ImportError:
    GIT_AVAILABLE = False

from coda.core.config import CodaConfig
from coda.utils.fs import should_ignore_path


class ActionExecutor:
    """Executes actions like file operations, shell commands, and git operations."""

    def __init__(self, config: CodaConfig, workspace: Path):
        self.config = config
        self.workspace = workspace

    def read_file(self, file_path: Path) -> str:
        """Read a file from the workspace."""
        full_path = self.workspace / file_path

        if should_ignore_path(full_path, self.config.ignore_patterns):
            raise PermissionError(f"File {file_path} is in ignore patterns")

        if not full_path.exists():
            raise FileNotFoundError(f"File {file_path} not found")

        try:
            return full_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raise ValueError(f"File {file_path} is not a text file")

    def write_file(self, file_path: Path, content: str) -> None:
        """Write content to a file."""
        full_path = self.workspace / file_path

        if should_ignore_path(full_path, self.config.ignore_patterns):
            raise PermissionError(f"File {file_path} is in ignore patterns")

        # Create directory if needed
        full_path.parent.mkdir(parents=True, exist_ok=True)

        full_path.write_text(content, encoding="utf-8")

    def delete_file(self, file_path: Path) -> None:
        """Delete a file."""
        full_path = self.workspace / file_path

        if not full_path.exists():
            raise FileNotFoundError(f"File {file_path} not found")

        if full_path.is_file():
            full_path.unlink()
        elif full_path.is_dir():
            shutil.rmtree(full_path)

    def list_files(self, directory: Path = Path(".")) -> List[str]:
        """List files in a directory."""
        full_path = self.workspace / directory

        if not full_path.exists() or not full_path.is_dir():
            raise NotADirectoryError(f"Directory {directory} not found")

        files = []
        for item in full_path.iterdir():
            if not should_ignore_path(item, self.config.ignore_patterns):
                files.append(item.name)

        return sorted(files)

    def execute_shell(self, command: str, cwd: Optional[Path] = None) -> Tuple[str, str, int]:
        """Execute a shell command."""
        if cwd is None:
            cwd = self.workspace
        else:
            cwd = self.workspace / cwd

        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=30,
            )
            return result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired:
            return "", "Command timed out", 1
        except Exception as e:
            return "", f"Error executing command: {e}", 1

    def install_dependencies(self, requirements: List[str]) -> Tuple[str, str, int]:
        """Install Python dependencies using uv."""
        if not requirements:
            return "", "No requirements provided", 1

        # Use uv to install dependencies
        command = f"uv add {' '.join(requirements)}"
        return self.execute_shell(command)

    def git_status(self) -> Dict[str, Any]:
        """Get git status information."""
        if not GIT_AVAILABLE:
            return {"error": "GitPython not available"}

        try:
            repo = git.Repo(self.workspace)
            return {
                "branch": repo.active_branch.name,
                "is_dirty": repo.is_dirty(),
                "untracked_files": repo.untracked_files,
                "modified_files": [item.a_path for item in repo.index.diff(None)],
                "staged_files": [item.a_path for item in repo.index.diff("HEAD")],
            }
        except Exception as e:
            return {"error": f"Git error: {e}"}

    def git_commit(self, message: str, files: Optional[List[str]] = None) -> Tuple[str, str, int]:
        """Commit changes to git."""
        if not GIT_AVAILABLE:
            return "", "GitPython not available", 1

        try:
            repo = git.Repo(self.workspace)

            if files:
                repo.index.add(files)
            else:
                repo.git.add(A=True)

            commit = repo.index.commit(message)
            return f"Committed {commit.hexsha[:8]}", "", 0
        except Exception as e:
            return "", f"Git commit error: {e}", 1