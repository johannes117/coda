from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import importlib.resources
import logging

from rich.markdown import Markdown
from rich.text import Text
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.reactive import reactive
from textual.widgets import Input, Label, RichLog, Static

from coda import __version__
from coda.core.agent import CodaAgent
from coda.core.config import CodaConfig


DEFAULT_MODEL = "gpt-5-coda"


@dataclass
class Command:
    key: str
    name: str


COMMANDS: list[Command] = [
    Command("/init", " create an AGENTS.md file with instructions for Coda"),
    Command("/status", " show current session configuration"),
    Command("/approvals", " choose what Coda can do without approval"),
    Command("/model", " choose what model and reasoning effort to use"),
]


def ascii_logo() -> str:
    lines = [
        "                                             ",   
        "  ░██████    ░██████   ░███████      ░███    ",
        " ░██   ░██  ░██   ░██  ░██   ░██    ░██░██   ",
        "░██        ░██     ░██ ░██    ░██  ░██  ░██  ",
        "░██        ░██     ░██ ░██    ░██ ░█████████ ",
        "░██        ░██     ░██ ░██    ░██ ░██    ░██ ",
        " ░██   ░██  ░██   ░██  ░██   ░██  ░██    ░██ ",
        "  ░██████    ░██████   ░███████   ░██    ░██",
    ]
    return "\n".join(lines)


class CodaApp(App):
    def __init__(self, config_path: Optional[Path] = None, debug: bool = False):
        super().__init__()
        self.config = CodaConfig.load(config_path)
        self.agent = CodaAgent(self.config)
        self.debug_mode = debug

        if debug:
            log_path = Path("/tmp/coda_app.log")
            log_path.write_text("")
            logging.basicConfig(
                level=logging.DEBUG,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                filename=str(log_path),
                filemode='w'
            )
            self.logger = logging.getLogger('CodaApp')
            self.logger.info("Debug mode enabled")

        # Set CSS path using package resources
        styles_path = importlib.resources.files("coda.ui.styles")
        self.CSS_PATH = str(styles_path / "dark.tcss")

    BINDINGS = [
        ("t", "toggle_theme", "theme"),
        ("escape", "interrupt", "interrupt"),
        ("ctrl+c", "quit", "quit"),
    ]

    is_dark = reactive(True)
    generating = reactive(False)

    def compose(self) -> ComposeResult:
        yield Vertical(
            Container(
                self._session_header(),
                self._command_palette(),
                id="welcome-screen",
            ),
            RichLog(id="chat", highlight=True, markup=True),
            self._prompt_bar(),
        )

    def on_mount(self) -> None:
        self.query_one("#chat").display = False
        self.call_after_refresh(self._focus_input)

    def _focus_input(self) -> None:
        self.query_one("#input", Input).focus()

    def _session_header(self) -> Container:
        workspace = str(Path.cwd())
        info = Vertical(
            Label(" >_ Coda Agent", id="session-title"),
            Label(f" (v{__version__})", id="session-version"),
            Label(f" model: {self.config.model} (/model to change)", id="session-model"),
            Label(f" directory: {workspace}", id="session-path"),
            id="session-meta",
        )
        return Container(
            Horizontal(
                Static(ascii_logo(), id="logo"),
                info,
            ),
            id="session-card",
        )

    def _command_palette(self) -> Container:
        return Container(
            Label(
                "To get started, describe a task or try one of these commands:\n",
                id="help-text",
            ),
            self._commands_block(),
            id="command-help",
        )

    def _commands_block(self) -> Container:
        rows: list[Horizontal] = []
        for command in COMMANDS:
            rows.append(
                Horizontal(
                    Label(command.key, classes="command-key"),
                    Label(command.name, classes="command-name"),
                    classes="command-row",
                )
            )
        return Container(*rows, id="commands-list")

    def _prompt_bar(self) -> Container:
        status = Label("ready", id="status")
        input_row = Horizontal(
            Label("▌", id="prompt-symbol"),
            Input(
                placeholder="Type a coding task and press Enter",
                id="input",
            ),
            status,
            id="prompt-row",
        )
        hint_row = Horizontal(
            Label("⏎", classes="prompt-hint-key"),
            Label(" send", classes="prompt-hint"),
            Label("^J", classes="prompt-hint-key"),
            Label(" newline", classes="prompt-hint"),
            Label("^T", classes="prompt-hint-key"),
            Label(" transcript", classes="prompt-hint"),
            Label("^C", classes="prompt-hint-key"),
            Label(" quit", classes="prompt-hint"),
            id="prompt-hints",
        )
        return Container(input_row, hint_row, id="prompt")

    def _update_visibility(self, home: bool) -> None:
        self.query_one("#welcome-screen").display = home
        self.query_one("#chat").display = not home

    def action_toggle_theme(self) -> None:
        self.is_dark = not self.is_dark
        styles_path = importlib.resources.files("coda.ui.styles")
        theme_file = "dark.tcss" if self.is_dark else "light.tcss"
        self.CSS_PATH = str(styles_path / theme_file)
        self.load_css(self.CSS_PATH)
        self.refresh_css()

    def watch_generating(self, generating: bool) -> None:
        status_label = self.query_one("#status", Label)
        status_label.update("working..." if generating else "ready")

    def action_interrupt(self) -> None:
        if self.generating:
            self.generating = False
            self._push_system("Generation interrupted.")
        else:
            self._push_system("Nothing to interrupt.")

    def action_quit(self) -> None:
        self.exit()

    def on_key(self, event) -> None:
        """Handle Ctrl+C directly since Textual intercepts it."""
        if event.key == "ctrl+c":
            self.exit()
            return

    async def on_input_submitted(self, event: Input.Submitted) -> None:
        text = event.value.strip()
        if not text:
            return

        if self.query_one("#welcome-screen").display:
            self._update_visibility(home=False)

        self._push_user(text)
        event.input.value = ""

        self.generating = True

        # Process with agent
        try:
            response = await self.agent.process_message(text)
            self._push_agent(response)
        except Exception as e:
            self._push_system(f"Error: {e}")

        self.generating = False
        self._focus_input()

    def _push_user(self, text: str) -> None:
        chat = self.query_one("#chat", RichLog)
        message = Text.from_markup(f"[#7aa2f7]▌[/] [dim]{text}[/]")
        chat.write(message)

    def _push_agent(self, text: str | Markdown) -> None:
        chat = self.query_one("#chat", RichLog)
        prefix = Text.from_markup("[#bb9af7]> [/] ")
        if isinstance(text, str):
            chat.write(prefix + Text(text))
        else:
            chat.write(prefix)
            chat.write(text)

    def _push_system(self, text: str) -> None:
        chat = self.query_one("#chat", RichLog)
        message = Text.from_markup(f"[#f7768e]■[/] [dim]{text}[/]")
        chat.write(message)
