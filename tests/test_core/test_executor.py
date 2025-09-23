"""Tests for the action executor."""

import pytest
from pathlib import Path

from coda.core.executor import ActionExecutor


def test_executor_read_file(executor, temp_workspace):
    """Test reading an existing file."""
    content = executor.read_file(Path("test.py"))
    assert content == "print('hello world')"


def test_executor_read_nonexistent_file(executor):
    """Test reading a file that doesn't exist."""
    with pytest.raises(FileNotFoundError):
        executor.read_file(Path("nonexistent.py"))


def test_executor_write_file(executor, temp_workspace):
    """Test writing a new file."""
    content = "def hello(): return 'world'"
    executor.write_file(Path("new_file.py"), content)

    # Verify file was created with correct content
    file_path = temp_workspace / "new_file.py"
    assert file_path.exists()
    assert file_path.read_text() == content


def test_executor_write_file_creates_directory(executor, temp_workspace):
    """Test that writing a file creates parent directories."""
    content = "test content"
    executor.write_file(Path("new_dir/subdir/file.txt"), content)

    # Verify directory structure was created
    file_path = temp_workspace / "new_dir/subdir/file.txt"
    assert file_path.exists()
    assert file_path.read_text() == content


def test_executor_delete_file(executor, temp_workspace):
    """Test deleting an existing file."""
    file_path = temp_workspace / "test.py"
    assert file_path.exists()

    executor.delete_file(Path("test.py"))
    assert not file_path.exists()


def test_executor_delete_nonexistent_file(executor):
    """Test deleting a file that doesn't exist."""
    with pytest.raises(FileNotFoundError):
        executor.delete_file(Path("nonexistent.py"))


def test_executor_list_files(executor, temp_workspace):
    """Test listing files in a directory."""
    files = executor.list_files()

    # Should contain the test files we created
    assert "test.py" in files
    assert "README.md" in files
    assert "src" in files  # Directory should be listed


def test_executor_list_files_in_subdirectory(executor):
    """Test listing files in a subdirectory."""
    files = executor.list_files(Path("src"))

    assert "__init__.py" in files
    assert "main.py" in files


def test_executor_execute_shell_success(executor):
    """Test executing a successful shell command."""
    stdout, stderr, code = executor.execute_shell("echo 'hello'")

    assert code == 0
    assert "hello" in stdout
    assert stderr == ""


def test_executor_execute_shell_failure(executor):
    """Test executing a failing shell command."""
    stdout, stderr, code = executor.execute_shell("nonexistent_command")

    assert code != 0
    assert stderr  # Should have error output


def test_executor_git_status(executor, temp_workspace):
    """Test getting git status."""
    # Initialize a git repo for testing
    from subprocess import run
    run(["git", "init"], cwd=temp_workspace, capture_output=True)
    run(["git", "config", "user.email", "test@example.com"], cwd=temp_workspace, capture_output=True)
    run(["git", "config", "user.name", "Test User"], cwd=temp_workspace, capture_output=True)

    status = executor.git_status()

    # Should return status information (or error if git not available)
    assert isinstance(status, dict)
    if "error" not in status:
        assert "branch" in status
        assert "is_dirty" in status


def test_executor_install_dependencies(executor):
    """Test installing dependencies."""
    stdout, stderr, code = executor.install_dependencies(["pytest"])

    # Should execute uv add command
    # We don't test the actual installation, just that the command runs
    assert isinstance(stdout, str)
    assert isinstance(stderr, str)
    assert isinstance(code, int)