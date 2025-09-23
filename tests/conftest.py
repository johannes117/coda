"""Pytest configuration and fixtures for Coda tests."""

import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, AsyncMock

from coda.core.config import CodaConfig
from coda.core.agent import CodaAgent
from coda.core.executor import ActionExecutor


@pytest.fixture
def temp_workspace():
    """Create a temporary workspace for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        workspace = Path(tmpdir)

        # Create some test files
        (workspace / "test.py").write_text("print('hello world')")
        (workspace / "README.md").write_text("# Test Project")

        # Create a subdirectory with files
        subdir = workspace / "src"
        subdir.mkdir()
        (subdir / "__init__.py").write_text("")
        (subdir / "main.py").write_text("def main(): pass")

        yield workspace


@pytest.fixture
def mock_config():
    """Create a mock configuration for testing."""
    config = CodaConfig()
    config.model = "gpt-4o-mini"
    config.auto_approve_read = True
    config.auto_approve_write = True
    config.auto_approve_shell = False
    config.openai_api_key = "test-key"
    return config


@pytest.fixture
def mock_llm_client():
    """Create a mock LLM client."""
    mock = AsyncMock()
    mock.generate_response.return_value = "Test response from LLM"
    mock.generate_code_edit.return_value = "# Updated code"
    mock.generate_shell_command.return_value = "ls -la"
    return mock


@pytest.fixture
def executor(mock_config, temp_workspace):
    """Create an ActionExecutor for testing."""
    return ActionExecutor(mock_config, temp_workspace)


@pytest.fixture
def agent(mock_config, temp_workspace, mock_llm_client):
    """Create a CodaAgent for testing."""
    agent = CodaAgent(mock_config, temp_workspace)
    agent.llm = mock_llm_client
    return agent