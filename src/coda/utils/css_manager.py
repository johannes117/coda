"""CSS management for Coda TUI."""

import sys
from pathlib import Path
from platformdirs import user_cache_dir
from coda.ui.theme import CodaThemeBase, TokyoNightTheme

if getattr(sys, "frozen", False):
    BASE_PATH = Path(sys._MEIPASS) / "coda"
else:
    BASE_PATH = Path(__file__).parent.parent


class CssManager:
    """Manages the generation of themed CSS for the TUI."""
    base_css_path: Path = BASE_PATH / "ui" / "styles" / "base.tcss"

    def __init__(self, theme: CodaThemeBase = TokyoNightTheme()):
        self.theme = theme
        cache_path = Path(user_cache_dir("coda"))
        self.css_file = cache_path / "coda.tcss"
        cache_path.mkdir(parents=True, exist_ok=True)
        if not self.css_file.exists():
            self.css_file.touch()

    def read_base_css(self) -> str:
        """Read the base CSS template file."""
        return self.base_css_path.read_text()

    def refresh(self):
        """Generate and write the final CSS file."""
        theme_vars = self.theme.to_css()
        base_css = self.read_base_css()
        final_css = f"{theme_vars}\n{base_css}"
        self.write(final_css)

    def write(self, css: str):
        """Write content to the cached CSS file."""
        with open(self.css_file, "w") as f:
            f.write(css)