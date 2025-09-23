from dataclasses import dataclass

# Tokyo Night colors (ported from your TS theme)
TOKYO_NIGHT = {
    "light": {
        "bg": "#e6e7ed",
        "bgSecondary": "#d6d8df",
        "text": "#343b59",
        "textMuted": "#888b94",
        "border": "#c1c2c7",
        "primary": "#65359d",
        "accent": "#006c86",
        "string": "#385f0d",
        "keyword": "#65359d",
        "function": "#2959aa",
        "comment": "#888b94",
        "operator": "#006C86",
        "number": "#965027",
        "builtin": "#006c86",
        "error": "#8c4351",
    },
    "dark": {
        "bg": "#24283b",
        "bgSecondary": "#1f2335",
        "bgTertiary": "#2c324a",
        "border": "#1b1e2e",
        "text": "#a9b1d6",
        "textMuted": "#8089b3",
        "textComment": "#5f6996",
        "primary": "#7aa2f7",
        "accent": "#bb9af7",
        "string": "#9ece6a",
        "keyword": "#bb9af7",
        "function": "#7aa2f7",
        "operator": "#89ddff",
        "number": "#ff9e64",
        "builtin": "#2ac3de",
        "error": "#f7768e",
    },
}


@dataclass(frozen=True)
class TokyoColors:
    bg: str
    bg_secondary: str
    bg_tertiary: str
    border: str
    text: str
    text_muted: str
    primary: str
    accent: str
    error: str
    number: str
    operator: str
    string: str
    keyword: str
    function: str
    builtin: str


def get_colors(is_dark: bool) -> TokyoColors:
    t = TOKYO_NIGHT["dark" if is_dark else "light"]
    # Fill missing keys for light mode with sensible defaults
    bg_tertiary = t.get("bgTertiary", t["bgSecondary"])
    return TokyoColors(
        bg=t["bg"],
        bg_secondary=t["bgSecondary"],
        bg_tertiary=bg_tertiary,
        border=t.get("border", "#1b1e2e"),
        text=t.get("text", "#343b59"),
        text_muted=t.get("textMuted", "#888b94"),
        primary=t.get("primary", "#7aa2f7"),
        accent=t.get("accent", "#bb9af7"),
        error=t.get("error", "#f7768e"),
        number=t.get("number", "#ff9e64"),
        operator=t.get("operator", "#89ddff"),
        string=t.get("string", "#9ece6a"),
        keyword=t.get("keyword", "#bb9af7"),
        function=t.get("function", "#7aa2f7"),
        builtin=t.get("builtin", "#2ac3de"),
    )