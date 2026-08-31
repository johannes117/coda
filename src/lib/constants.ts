/**
 * Global constants for the coda CLI.
 *
 * Centralized here to avoid magic numbers scattered across the codebase.
 * Values are tuned for a good default experience on typical terminal
 * sizes (80×24) and can be overridden by user configuration where
 * applicable.
 */

// ─── Search ──────────────────────────────────────────────────────────────────

/** Maximum number of file search results to display. */
export const SEARCH_RESULTS_LIMIT = 10;

/** Maximum number of grep results to display. */
export const GREP_RESULTS_LIMIT = 50;

/** Maximum number of glob results to display. */
export const GLOB_RESULTS_LIMIT = 100;

// ─── Agent ───────────────────────────────────────────────────────────────────

/** Maximum recursion depth for agent tool calls. */
export const AGENT_RECURSION_LIMIT = 9999;

/** Maximum number of retry attempts on transient API errors. */
export const AGENT_MAX_RETRIES = 3;

/** Delay between retry attempts in milliseconds. */
export const AGENT_RETRY_DELAY_MS = 1000;

// ─── Terminal ────────────────────────────────────────────────────────────────

/** Default terminal width assumed when detection fails. */
export const DEFAULT_TERMINAL_WIDTH = 80;

/** Default terminal height assumed when detection fails. */
export const DEFAULT_TERMINAL_HEIGHT = 24;

/** Minimum terminal width for comfortable two-column layouts. */
export const MIN_WIDE_TERMINAL_WIDTH = 120;

// ─── UI ──────────────────────────────────────────────────────────────────────

/** Maximum visible lines for code blocks before truncating. */
export const CODE_BLOCK_MAX_HEIGHT = 20;

/** Spinner animation interval in milliseconds. */
export const SPINNER_INTERVAL_MS = 80;

/** Maximum width for status line text. */
export const STATUS_LINE_MAX_WIDTH = 60;

/** Debounce delay for input processing in milliseconds. */
export const INPUT_DEBOUNCE_MS = 50;

// ─── Diff ────────────────────────────────────────────────────────────────────

/** Default number of context lines to show around diff changes. */
export const DIFF_CONTEXT_LINES = 3;

/** Maximum number of diff lines to render before truncating. */
export const DIFF_MAX_LINES = 500;

// ─── Logging ─────────────────────────────────────────────────────────────────

/** Maximum log file size in bytes before rotation (10 MB). */
export const LOG_MAX_SIZE = 10 * 1024 * 1024;

/** Number of rotated log files to keep. */
export const LOG_KEEP_ROTATED = 3;
