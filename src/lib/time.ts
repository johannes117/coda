/**
 * Time formatting utilities for the coda CLI.
 *
 * All functions return strings suitable for terminal display. They avoid
 * pulling in a full date library and instead rely on the built-in
 * Intl/Date APIs with sensible fallbacks.
 */

/**
 * Current time as a 4-char string, e.g. "9:30", "10:45".
 * Uses 12-hour format with no seconds.
 */
export const nowTime = (): string =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).slice(0, 5);

/**
 * Current time with seconds, e.g. "9:30:45 AM".
 */
export const nowTimeWithSeconds = (): string =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

/**
 * Current time in 24-hour format, e.g. "14:30".
 */
export const nowTime24h = (): string =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

/**
 * Format a timestamp as a relative "time ago" string.
 * e.g. "just now", "5m ago", "2h ago", "3d ago".
 */
export function timeAgo(date: Date | number): string {
  const ts = typeof date === 'number' ? date : date.getTime();
  const seconds = Math.floor((Date.now() - ts) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

/**
 * Format a duration in milliseconds as a human-readable string.
 * e.g. "1.2s", "450ms", "2m 30s".
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a timestamp for log entries (ISO 8601 with milliseconds).
 */
export function formatLogTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Generate a session ID based on the current timestamp.
 * Format: YYYYMMDD-HHMMSS
 */
export function generateSessionId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}
