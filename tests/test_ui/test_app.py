"""Tests for the Coda UI application."""

import pytest
from unittest.mock import Mock, patch

from coda.ui.app import CodaApp, ascii_logo
from coda.ui.theme import get_theme


def test_ascii_logo():
    """Test that ASCII logo is properly formatted."""
    logo = ascii_logo()
    assert isinstance(logo, str)
    assert len(logo.split("\n")) == 11  # Logo has 11 lines
    assert "___" in logo  # Contains ASCII art


def test_get_theme_dark():
    """Test dark theme configuration."""
    theme = get_theme(is_dark=True)
    assert theme.bg == "#1a1b26"
    assert theme.primary == "#bb9af7"
    assert theme.accent == "#7aa2f7"


def test_get_theme_light():
    """Test light theme configuration."""
    theme = get_theme(is_dark=False)
    assert theme.bg == "#d5d6db"
    assert theme.primary == "#7847bd"
    assert theme.accent == "#3d59a1"


@pytest.mark.asyncio
async def test_app_initialization(mock_config):
    """Test that the app initializes correctly."""
    with patch("coda.ui.app.CodaConfig.load", return_value=mock_config):
        app = CodaApp()
        assert app.config == mock_config
        assert app.is_dark is True
        assert app.generating is False


class TestCodaAppCommands:
    """Test command handling in CodaApp."""

    @pytest.fixture
    def app(self, mock_config):
        """Create a CodaApp instance for testing."""
        with patch("coda.ui.app.CodaConfig.load", return_value=mock_config):
            return CodaApp()

    def test_toggle_theme(self, app):
        """Test theme toggling."""
        initial_theme = app.is_dark
        app.action_toggle_theme()
        assert app.is_dark != initial_theme

    def test_interrupt_when_not_generating(self, app):
        """Test interrupt action when not generating."""
        app.generating = False

        # Mock the system message method
        app._push_system = Mock()

        app.action_interrupt()
        app._push_system.assert_called_with("Nothing to interrupt.")

    def test_interrupt_when_generating(self, app):
        """Test interrupt action when generating."""
        app.generating = True

        # Mock the system message method
        app._push_system = Mock()

        app.action_interrupt()
        assert app.generating is False
        app._push_system.assert_called_with("Generation interrupted.")