import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Severity levels for structured logging.
 * Ordered from least to most severe.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

const STORAGE_DIR = path.join(os.homedir(), '.coda');
const LOGS_DIR = path.join(STORAGE_DIR, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'coda.log');

/**
 * Minimum level to log. Messages below this level are silently dropped.
 * Can be changed at runtime to increase/decrease verbosity.
 */
let minLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

export function getLogLevel(): LogLevel {
  return minLevel;
}

export async function ensureLogDir(): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

export async function clearLog(): Promise<void> {
  await ensureLogDir();
  await fs.writeFile(LOG_FILE, '');
}

/**
 * Internal: write a formatted log entry to the log file.
 */
async function writeLog(level: LogLevel, message: string): Promise<void> {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
  const timestamp = new Date().toISOString();
  const label = LEVEL_LABELS[level];
  const entry = `[${timestamp}] ${label}: ${message}\n`;
  try {
    await fs.appendFile(LOG_FILE, entry, 'utf8');
  } catch {
    // Silently ignore write errors — logging should never crash the app
  }
}

export async function logDebug(message: string): Promise<void> {
  await writeLog('debug', message);
}

export async function logInfo(message: string): Promise<void> {
  await writeLog('info', message);
}

export async function logWarn(message: string): Promise<void> {
  await writeLog('warn', message);
}

export async function logError(message: string): Promise<void> {
  await writeLog('error', message);
}

/**
 * Log a message with an associated error object, including the stack trace
 * if available.
 */
export async function logErrorWithStack(message: string, error: unknown): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const detail = `${message}\n  ${err.name}: ${err.message}\n  ${err.stack ?? '(no stack trace)'}`;
  await writeLog('error', detail);
}

/**
 * Read the last N lines from the log file. Useful for diagnostics.
 */
export async function readRecentLog(lines: number = 50): Promise<string[]> {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const allLines = data.split('\n').filter(Boolean);
    return allLines.slice(-lines);
  } catch {
    return [];
  }
}

/**
 * Get the current size of the log file in bytes.
 */
export async function getLogSize(): Promise<number> {
  try {
    const stat = await fs.stat(LOG_FILE);
    return stat.size;
  } catch {
    return 0;
  }
}
