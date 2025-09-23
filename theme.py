from dataclasses import dataclass

# Tokyo Night colors
TOKYO_NIGHT = {
    "dark": {
        "bg": "#1a1b26",
        "bg_secondary": "#24283b",
        "bg_tertiary": "#414868",
        "border": "#16161e",
        "text": "#c0caf5",
        "text_muted": "#a9b1d6",
        "text_comment": "#565f89",
        "primary": "#bb9af7",
        "accent": "#7aa2f7",
        "error": "#f7768e",
        "green": "#9ece6a",
    },
    "light": {
        "bg": "#d5d6db",
        "bg_secondary": "#e9e9ed",
        "bg_tertiary": "#d5d6db",
        "border": "#c8c8d0",
        "text": "#343b59",
        "text_muted": "#9699a3",
        "text_comment": "#848899",
        "primary": "#7847bd",
        "accent": "#3d59a1",
        "error": "#b13c4b",
        "green": "#587539",
    },
}


@dataclass(frozen=True)
class CodaTheme:
    bg: str
    bg_secondary: str
    bg_tertiary: str
    border: str
    text: str
    text_muted: str
    text_comment: str
    primary: str
    accent: str
    error: str
    green: str


def get_theme(is_dark: bool) -> CodaTheme:
    theme_name = "dark" if is_dark else "light"
    t = TOKYO_NIGHT[theme_name]
    return CodaTheme(**t)
