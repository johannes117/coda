"""Tests for the Coda agent."""

import pytest
from unittest.mock import patch, AsyncMock

from coda.core.agent import CodaAgent


@pytest.mark.asyncio
async def test_agent_process_message(agent, mock_llm_client):
    """Test basic message processing."""
    mock_llm_client.generate_response.return_value = "I can help with that!"

    response = await agent.process_message("Hello")

    assert response == "I can help with that!"
    assert len(agent.conversation_history) == 2  # User message + assistant response
    mock_llm_client.generate_response.assert_called_once()


@pytest.mark.asyncio
async def test_agent_handle_status_command(agent):
    """Test /status command handling."""
    response = await agent.process_message("/status")

    assert "Session Status" in response
    assert "Model:" in response
    assert "Workspace:" in response
    assert "Approvals:" in response


@pytest.mark.asyncio
async def test_agent_handle_init_command(agent, temp_workspace):
    """Test /init command creates AGENTS.md file."""
    response = await agent.process_message("/init")

    assert "Created AGENTS.md" in response
    agents_file = temp_workspace / "AGENTS.md"
    assert agents_file.exists()
    content = agents_file.read_text()
    assert "Coda Agent Instructions" in content


@pytest.mark.asyncio
async def test_agent_handle_model_command(agent):
    """Test /model command handling."""
    # Test showing current model
    response = await agent.process_message("/model")
    assert "Current model:" in response

    # Test changing model
    response = await agent.process_message("/model gpt-4o")
    assert "Model changed to: gpt-4o" in response
    assert agent.config.model == "gpt-4o"


@pytest.mark.asyncio
async def test_agent_handle_approvals_command(agent):
    """Test /approvals command handling."""
    response = await agent.process_message("/approvals")

    assert "Approval Settings" in response
    assert "Read files:" in response
    assert "Write files:" in response


def test_agent_parse_actions(agent):
    """Test parsing actions from LLM responses."""
    response = """I'll help you with that. Let me [READ main.py] first,
    then [WRITE config.py] and [SHELL ls -la] to check the directory."""

    actions = agent._parse_actions(response)

    assert len(actions) == 3
    assert actions[0]["type"] == "read"
    assert actions[0]["target"] == "main.py"
    assert actions[1]["type"] == "write"
    assert actions[1]["target"] == "config.py"
    assert actions[2]["type"] == "shell"
    assert actions[2]["target"] == "ls -la"


@pytest.mark.asyncio
async def test_agent_execute_read_action_approved(agent, temp_workspace):
    """Test executing read action when auto-approved."""
    agent.config.auto_approve_read = True

    actions = [{"type": "read", "target": "test.py"}]
    result = await agent._execute_actions(actions)

    assert "Read test.py" in result
    assert "chars)" in result  # Should show character count


@pytest.mark.asyncio
async def test_agent_execute_action_needs_approval(agent):
    """Test executing action that needs approval."""
    agent.config.auto_approve_write = False

    actions = [{"type": "write", "target": "new_file.py"}]
    result = await agent._execute_actions(actions)

    assert "[APPROVAL NEEDED] Write new_file.py" in result