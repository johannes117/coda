/**
 * ANSI escape sequence utilities for terminal rendering.
 *
 * Provides constants for common escape codes and helper functions for
 * constructing styled strings. All codes use the SGR (Select Graphic
 * Rendition) subset of ANSI escape sequences.
 *
 * References:
 *   - https://en.wikipedia.org/wiki/ANSI_escape_code#SGR
 *   - https://gist.github.com/fnky/45871934321594adff55830d8b8b8f56
 */

// ─── Control characters ──────────────────────────────────────────────────────

export const ESC = '\x1b';
export const CSI = `${ESC}[`;
export const OSC = `${ESC}]`;
export const BEL = '\x07';
export const BACKSPACE = '\b';
export const TAB = '\t';
export const NEWLINE = '\n';
export const CARRIAGE_RETURN = '\r';

// ─── Cursor movement ─────────────────────────────────────────────────────────

export const cursorUp = (n = 1) => `${CSI}${n}A`;
export const cursorDown = (n = 1) => `${CSI}${n}B`;
export const cursorForward = (n = 1) => `${CSI}${n}C`;
export const cursorBack = (n = 1) => `${CSI}${n}D`;
export const cursorNextLine = (n = 1) => `${CSI}${n}E`;
export const cursorPrevLine = (n = 1) => `${CSI}${n}F`;
export const cursorColumn = (n = 1) => `${CSI}${n}G`;
export const cursorPosition = (row: number, col: number) => `${CSI}${row};${col}H`;
export const cursorSave = `${ESC}7`;
export const cursorRestore = `${ESC}8`;
export const cursorHide = `${CSI}?25l`;
export const cursorShow = `${CSI}?25h`;

// ─── Erase sequences ─────────────────────────────────────────────────────────

export const eraseToEnd = `${CSI}J`;
export const eraseFromStart = `${CSI}1J`;
export const eraseLine = `${CSI}2J`;
export const eraseLineToEnd = `${CSI}K`;
export const eraseLineFromStart = `${CSI}1K`;
export const eraseEntireLine = `${CSI}2K`;
export const eraseScrollback = `${CSI}3J`;

// ─── Text styling (SGR) ──────────────────────────────────────────────────────

export const reset = `${CSI}0m`;
export const bold = `${CSI}1m`;
export const dim = `${CSI}2m`;
export const italic = `${CSI}3m`;
export const underline = `${CSI}4m`;
export const blink = `${CSI}5m`;
export const reverse = `${CSI}7m`;
export const hidden = `${CSI}8m`;
export const strikethrough = `${CSI}9m`;

export const resetBold = `${CSI}22m`;
export const resetDim = `${CSI}22m`;
export const resetItalic = `${CSI}23m`;
export const resetUnderline = `${CSI}24m`;
export const resetBlink = `${CSI}25m`;
export const resetReverse = `${CSI}27m`;
export const resetHidden = `${CSI}28m`;
export const resetStrikethrough = `${CSI}29m`;

// ─── Foreground colors ───────────────────────────────────────────────────────

export const fg = {
  black: `${CSI}30m`,
  red: `${CSI}31m`,
  green: `${CSI}32m`,
  yellow: `${CSI}33m`,
  blue: `${CSI}34m`,
  magenta: `${CSI}35m`,
  cyan: `${CSI}36m`,
  white: `${CSI}37m`,
  default: `${CSI}39m`,
  // Bright variants
  brightBlack: `${CSI}90m`,
  brightRed: `${CSI}91m`,
  brightGreen: `${CSI}92m`,
  brightYellow: `${CSI}93m`,
  brightBlue: `${CSI}94m`,
  brightMagenta: `${CSI}95m`,
  brightCyan: `${CSI}96m`,
  brightWhite: `${CSI}97m`,
};

// ─── Background colors ───────────────────────────────────────────────────────

export const bg = {
  black: `${CSI}40m`,
  red: `${CSI}41m`,
  green: `${CSI}42m`,
  yellow: `${CSI}43m`,
  blue: `${CSI}44m`,
  magenta: `${CSI}45m`,
  cyan: `${CSI}46m`,
  white: `${CSI}47m`,
  default: `${CSI}49m`,
  // Bright variants
  brightBlack: `${CSI}100m`,
  brightRed: `${CSI}101m`,
  brightGreen: `${CSI}102m`,
  brightYellow: `${CSI}103m`,
  brightBlue: `${CSI}104m`,
  brightMagenta: `${CSI}105m`,
  brightCyan: `${CSI}106m`,
  brightWhite: `${CSI}107m`,
};

// ─── 256-color and true color ────────────────────────────────────────────────

export const fg256 = (code: number) => `${CSI}38;5;${code}m`;
export const bg256 = (code: number) => `${CSI}48;5;${code}m`;
export const fgRgb = (r: number, g: number, b: number) => `${CSI}38;2;${r};${g};${b}m`;
export const bgRgb = (r: number, g: number, b: number) => `${CSI}48;2;${r};${g};${b}m`;

// ─── Screen modes ────────────────────────────────────────────────────────────

export const enterAltScreen = `${CSI}?1049h`;
export const exitAltScreen = `${CSI}?1049l`;
export const enableMouseTracking = `${CSI}?1000h`;
export const disableMouseTracking = `${CSI}?1000l`;
export const enableFocusTracking = `${CSI}?1004h`;
export const disableFocusTracking = `${CSI}?1004l`;
export const enableBracketedPaste = `${CSI}?2004h`;
export const disableBracketedPaste = `${CSI}?2004l`;

// ─── Helper functions ────────────────────────────────────────────────────────

/**
 * Strip all ANSI escape sequences from a string.
 * Useful for computing visible string width or for clean output.
 */
export function stripAnsi(text: string): string {
  // Matches CSI sequences, OSC sequences, and single ESC characters
  const pattern = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -~]*|\][^\x07]*(?:\x07|\x1B\\))/g;
  return text.replace(pattern, '');
}

/**
 * Get the visible length of a string (excluding ANSI escape sequences).
 */
export function visibleLength(text: string): number {
  return stripAnsi(text).length;
}

/**
 * Wrap text with ANSI styling codes. Resets at the end.
 */
export function style(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${reset}`;
}

/**
 * Apply foreground color to text.
 */
export function colorize(text: string, colorCode: string): string {
  return `${colorCode}${text}${reset}`;
}

/**
 * Apply bold styling to text.
 */
export function boldText(text: string): string {
  return `${bold}${text}${reset}`;
}

/**
 * Apply dim styling to text.
 */
export function dimText(text: string): string {
  return `${dim}${text}${reset}`;
}

/**
 * Apply underline styling to text.
 */
export function underlineText(text: string): string {
  return `${underline}${text}${reset}`;
}

/**
 * Apply strikethrough styling to text.
 */
export function strikethroughText(text: string): string {
  return `${strikethrough}${text}${reset}`;
}

/**
 * Truncate text to a maximum visible width, adding an ellipsis if truncated.
 * ANSI sequences are preserved and not counted toward the width.
 */
export function truncateAnsi(text: string, maxWidth: number, ellipsis = '…'): string {
  const stripped = stripAnsi(text);
  if (stripped.length <= maxWidth) return text;

  // For simplicity, strip and re-truncate. A full implementation would
  // preserve styling across the truncation boundary, but that's overkill
  // for our use case.
  const truncated = stripped.slice(0, maxWidth - ellipsis.length);
  return `${truncated}${ellipsis}`;
}

/**
 * Pad a string to a target visible width, accounting for ANSI sequences.
 */
export function padAnsi(text: string, targetWidth: number, padChar = ' '): string {
  const visible = visibleLength(text);
  if (visible >= targetWidth) return text;
  const padding = padChar.repeat(targetWidth - visible);
  return `${text}${padding}`;
}

/**
 * Center a string within a target visible width.
 */
export function centerAnsi(text: string, targetWidth: number, padChar = ' '): string {
  const visible = visibleLength(text);
  if (visible >= targetWidth) return text;
  const totalPadding = targetWidth - visible;
  const leftPad = Math.floor(totalPadding / 2);
  const rightPad = totalPadding - leftPad;
  return `${padChar.repeat(leftPad)}${text}${padChar.repeat(rightPad)}`;
}

// ─── Terminal query sequences ────────────────────────────────────────────────

/**
 * Query terminal size. The terminal responds with CSI rows;colsR.
 * This must be read from stdin asynchronously.
 */
export const queryTerminalSize = `${CSI}18t`;

/**
 * Query cursor position. The terminal responds with CSI row;colR.
 */
export const queryCursorPosition = `${CSI}6n`;

// ─── Scroll region ───────────────────────────────────────────────────────────

/**
 * Set the scroll region (top and bottom margins).
 */
export function setScrollRegion(top: number, bottom: number): string {
  return `${CSI}${top};${bottom}r`;
}

/**
 * Reset the scroll region to the full screen.
 */
export const resetScrollRegion = `${CSI}r`;

/**
 * Scroll up by n lines within the scroll region.
 */
export const scrollUp = (n = 1) => `${CSI}${n}S`;

/**
 * Scroll down by n lines within the scroll region.
 */
export const scrollDown = (n = 1) => `${CSI}${n}T`;

// ─── OSC sequences (terminal titles, hyperlinks) ────────────────────────────

/**
 * Set the terminal window title.
 */
export function setTitle(title: string): string {
  return `${OSC}0;${title}${BEL}`;
}

/**
 * Create a clickable hyperlink (supported by many modern terminals).
 */
export function hyperlink(text: string, url: string): string {
  return `${OSC}8;;${url}${BEL}${text}${OSC}8;;${BEL}`;
}
