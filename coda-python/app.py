from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from rich.markdown import Markdown
from textual import events
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical, VerticalScroll
from textual.reactive import reactive
from textual.widgets import Input, Label, Rule, Static

from __init__ import __version__
from theme import get_colors


DEFAULT_MODEL = "gpt-5-coda"


@dataclass
class Command:
    key: str
    name: str
    kb: str


COMMANDS: list[Command] = [
    Command("/new", "new session", "ctrl+x n"),
    Command("/help", "show help", "ctrl+x h"),
    Command("/share", "share session", "ctrl+x s"),
    Command("/models", "list models", "ctrl+x m"),
    Command("/agents", "list agents", "ctrl+x a"),
    Command("/editor", "open editor", "ctrl+x e"),
]


def ascii_logo() -> str:
    return (
        "   ██████  ██████  ██████   █████ \n"
        "  ██      ██    ██ ██   ██ ██   ██\n"
        "  ██      ██    ██ ██   ██ ███████\n"
        "  ██      ██    ██ ██   ██ ██   ██\n"
        "   ██████  ██████  ██████  ██   ██"
    )


class Coda(App):
    CSS_PATH = "styles_dark.tcss"

    BINDINGS = [
        ("ctrl+x,ctrl+n", "new_session", "new"),
        ("ctrl+x,ctrl+h", "show_help", "help"),
        ("ctrl+x,ctrl+s", "share_session", "share"),
        ("ctrl+x,ctrl+m", "list_models", "models"),
        ("ctrl+x,ctrl+a", "list_agents", "agents"),
        ("ctrl+x,ctrl+e", "open_editor", "editor"),
        ("t", "toggle_theme", "theme"),
        ("escape", "interrupt", "interrupt"),
    ]

    is_dark = reactive(True)
    generating = reactive(False)

    def compose(self) -> ComposeResult:
        yield Vertical(
            self._session_header(),
            self._command_palette(),
            Rule(id="divider"),
            VerticalScroll(id="chat"),
            self._prompt_bar(),
        )

    def on_mount(self) -> None:
        self._update_visibility(home=True)
        self.call_after_refresh(self._focus_input)
        self.watch_generating(self.generating)
        self._push_system(f"Model ready: {DEFAULT_MODEL}")

    def _focus_input(self) -> None:
        try:
            self.query_one("#input", Input).focus()
        except Exception:
            pass

    def _session_header(self) -> Container:
        workspace = str(Path.cwd())
        info = Vertical(
            Label("_ Coda Agent", id="session-title"),
            Label(f"version {__version__}", id="session-version"),
            Label(
                f"model: {DEFAULT_MODEL}  /model to change",
                id="session-model",
            ),
            Label(f"workspace: {workspace}", id="session-path"),
            id="session-meta",
        )
        return Container(
            Static(ascii_logo(), id="logo"),
            info,
            id="session-card",
        )

    def _command_palette(self) -> Container:
        return Container(
            Label(
                "To get started, describe a task or try one of these commands:",
                id="help-text",
            ),
            self._commands_block(),
            id="command-help",
        )

    def _commands_block(self) -> Container:
        rows: list[Horizontal] = []
        for c in COMMANDS:
            rows.append(
                Horizontal(
                    Label(c.key, classes="command-key"),
                    Label(c.name, classes="command-name"),
                    Label(c.kb, classes="command-hint"),
                    classes="command-row",
                )
            )
        return Container(*rows, id="commands-list")

    def _prompt_bar(self) -> Container:
        input_row = Horizontal(
            Label(">", id="prompt-symbol"),
            Input(
                placeholder="Type a coding task and press Enter",
                id="input",
                classes="prompt-input",
            ),
            Label("coda", id="status-left"),
            Label("ready", id="status-right"),
            id="prompt-row",
        )
        hint_row = Horizontal(
            Label("↵ send", classes="prompt-hint"),
            Label("^J newline", classes="prompt-hint"),
            Label("^T transcript", classes="prompt-hint"),
            Label("^C quit", classes="prompt-hint"),
            id="prompt-hints",
        )
        return Container(input_row, hint_row, id="prompt")

    def _update_visibility(self, home: bool) -> None:
        self.query_one("#session-card").display = home
        self.query_one("#command-help").display = home
        self.query_one("#chat").display = True

    def action_toggle_theme(self) -> None:
        self.is_dark = not self.is_dark
        css = (
            "styles_dark.tcss"
            if self.is_dark
            else "styles_light.tcss"
        )
        self.load_css(css)

    def watch_generating(self, generating: bool) -> None:
        try:
            status_label = self.query_one("#status-right", Label)
        except Exception:
            return
        status_label.update("working..." if generating else "ready")

    def action_new_session(self) -> None:
        chat = self.query_one("#chat", VerticalScroll)
        chat.clear()
        self._update_visibility(home=True)
        self._push_system(
            "New session created. Ask me to build or refactor code."
        )
        self.query_one("#input", Input).value = ""
        self.call_after_refresh(self._focus_input)

    def action_show_help(self) -> None:
        self._push_system(
            "Shortcuts: ctrl+x n new • ctrl+x h help • ctrl+x s "
            "share • ctrl+x m models • ctrl+x a agents • ctrl+x e editor "
            "• t theme • esc interrupt"
        )

    def action_share_session(self) -> None:
        self._push_system("Share link (dummy): https://coda.local/abc123")

    def action_list_models(self) -> None:
        self._push_system("Models (dummy): gpt-code-1, sonnet-3.5, llama-3.1")

    def action_list_agents(self) -> None:
        self._push_system("Agents (dummy): Build, Fix, Explain, Test")

    def action_open_editor(self) -> None:
        self._push_system("Editor opened (dummy).")

    def action_interrupt(self) -> None:
        if self.generating:
            self.generating = False
            self._push_system("Generation interrupted.")
        else:
            self._push_system("Nothing to interrupt.")

    async def on_input_submitted(self, event: Input.Submitted) -> None:
        text = event.value.strip()
        if not text:
            return

        if text.startswith("/"):
            # Fallback: echo command into system area
            self._push_system(f"Command: {text} (not implemented yet)")
            event.input.value = ""
            return

        # Enter session mode
        self._update_visibility(home=False)

        # Push user message
        self._push_user(text)
        event.input.value = ""

        # Simulate agent generation with dummy data
        self.generating = True
        await self._push_dummy_agent_response(text)
        self.generating = False

    def _push_user(self, text: str) -> None:
        chat = self.query_one("#chat", VerticalScroll)
        msg = Static(f"[b]you[/b]\n{text}", classes="message user")
        chat.mount(msg)
        chat.scroll_end(animate=False)

    def _push_system(self, text: str) -> None:
        chat = self.query_one("#chat", VerticalScroll)
        msg = Static(text, classes="message")
        chat.mount(msg)
        chat.scroll_end(animate=False)

    async def _push_dummy_agent_response(self, user_text: str) -> None:
        chat = self.query_one("#chat", VerticalScroll)

        # Header (matches screenshot vibe)
        title = Static(
            "# Implementing coin change in Python\n"
            "/share to create a shareable link",
            classes="message agent",
        )
        chat.mount(title)

        # Code write step
        step = Static("Write coin_change.py", classes="message agent")
        chat.mount(step)

        # Code block (dummy)
        code_md = Markdown(
            "```python\n"
            "def coin_change(coins, amount):\n"
            "    if amount == 0:\n"
            "        return 0\n"
            "    dp = [float('inf')] * (amount + 1)\n"
            "    dp[0] = 0\n"
            "    for coin in coins:\n"
            "        for i in range(coin, amount + 1):\n"
            "            dp[i] = min(dp[i], dp[i - coin] + 1)\n"
            "    return dp[amount] if dp[amount] != float('inf') else -1\n"
            "```\n"
        )
        chat.mount(Static(code_md, classes="message agent"))

        # Error + hint (dummy)
        err = Static(
            "[b]Error:[/b] You must read the file "
            "/Users/johannes.duplessis/coin_change.py before overwriting it.\n"
            "Use the Read tool first",
            classes="message agent",
        )
        err.add_class("error")
        chat.mount(err)

        # Directory listing (dummy)
        listing = Markdown(
            "```\n"
            "List /Users/johannes.duplessis\n\n"
            "/Users/johannes.duplessis/\n"
            "  .azure/\n"
            "  bin/\n"
            "  bicep\n"
            "  logs/\n"
            "    telemetry.log\n"
            "  az.json\n"
            "  az.sess\n"
            "  az_survey.json\n"
            "  azureProfile.json\n"
            "```\n"
        )
        chat.mount(Static(listing, classes="message agent"))

        # Status footer line (dummy)
        chat.mount(
            Static("working..    esc interrupt", classes="message agent")
        )

        chat.scroll_end(animate=False)

    def on_resize(self, event: events.Resize) -> None:
        # Keep input focused during resizes for smooth typing
        self._focus_input()


def main() -> None:
    # Ensure initial theme aligns with Tokyo Night dark
    colors = get_colors(True)
    _ = colors  # reserved if you decide to programmatically theme widgets
    Coda().run()
