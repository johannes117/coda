"""Theme definition for Coda TUI."""


class CodaThemeBase:
    """Base class for Coda themes."""

    _name: str = "coda-base"

    # background colors
    background1: str = "#1a1b26"  # Darkest
    background2: str = "#24283b"  # Lighter
    background3: str = "#414868"  # Lightest

    # foreground colors
    foreground1: str = "#a9b1d6"  # Darkest
    foreground2: str = "#c0caf5"  # Lighter
    foreground3: str = "#c0caf5"  # Lightest

    # other colors
    red: str = "#f7768e"
    orange: str = "#ff9e64"
    yellow: str = "#e0af68"
    green: str = "#9ece6a"
    blue: str = "#7aa2f7"
    purple: str = "#bb9af7"

    # accent colors
    primary: str = blue
    secondary: str = purple

    @classmethod
    def to_css(cls) -> str:
        """Generate CSS variables from the theme."""
        return f"""
$background1: {cls.background1};
$background2: {cls.background2};
$background3: {cls.background3};

$foreground1: {cls.foreground1};
$foreground2: {cls.foreground2};
$foreground3: {cls.foreground3};

$red: {cls.red};
$orange: {cls.orange};
$yellow: {cls.yellow};
$green: {cls.green};
$blue: {cls.blue};
$purple: {cls.purple};

$primary: {cls.primary};
$secondary: {cls.secondary};
"""


class TokyoNightTheme(CodaThemeBase):
    """The default Tokyo Night theme."""
    _name: str = "tokyo-night"