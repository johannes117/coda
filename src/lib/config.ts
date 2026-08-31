/**
 * Configuration management for the coda CLI.
 *
 * Wraps the on-disk config.json with a typed accessor layer, providing
 * defaults, validation, and a simple migration path for future schema
 * changes. All reads are cached in-memory after the first load to avoid
 * redundant I/O on every status-line render.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logError, logInfo } from './logger.js';

const STORAGE_DIR = path.join(os.homedir(), '.coda');
const CONFIG_FILE = path.join(STORAGE_DIR, 'config.json');

// ─── Types ───────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';

export type EditorConfig = {
  /** Editor command to open files (e.g. "code", "vim"). */
  command: string;
  /** Extra args passed to the editor. */
  args: string[];
  /** Whether to wait for the editor to close before returning. */
  wait: boolean;
};

export type DiffConfig = {
  /** Number of context lines to show around changes. */
  contextLines: number;
  /** Maximum number of diff lines to render before truncating. */
  maxLines: number;
  /** Whether to show line numbers in the diff view. */
  showLineNumbers: boolean;
};

export type AgentConfig = {
  /** Maximum recursion depth for agent tool calls. */
  recursionLimit: number;
  /** Maximum retry attempts on transient errors. */
  maxRetries: number;
  /** Delay between retries in milliseconds. */
  retryDelayMs: number;
  /** Whether to stream partial responses. */
  stream: boolean;
};

export type UIConfig = {
  /** Terminal width at which to wrap messages. */
  messageMaxWidth: number;
  /** Maximum height for code blocks before scrolling. */
  codeBlockMaxHeight: number;
  /** Spinner animation interval in milliseconds. */
  spinnerIntervalMs: number;
  /** Theme preference. */
  theme: ThemeMode;
};

export type AppConfig = {
  editor: EditorConfig;
  diff: DiffConfig;
  agent: AgentConfig;
  ui: UIConfig;
  /** Schema version for migration purposes. */
  version: number;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_EDITOR: EditorConfig = {
  command: 'vi',
  args: [],
  wait: true,
};

const DEFAULT_DIFF: DiffConfig = {
  contextLines: 3,
  maxLines: 500,
  showLineNumbers: true,
};

const DEFAULT_AGENT: AgentConfig = {
  recursionLimit: 9999,
  maxRetries: 3,
  retryDelayMs: 1000,
  stream: true,
};

const DEFAULT_UI: UIConfig = {
  messageMaxWidth: 120,
  codeBlockMaxHeight: 20,
  spinnerIntervalMs: 80,
  theme: 'dark',
};

const DEFAULT_CONFIG: AppConfig = {
  editor: DEFAULT_EDITOR,
  diff: DEFAULT_DIFF,
  agent: DEFAULT_AGENT,
  ui: DEFAULT_UI,
  version: 1,
};

// ─── Cache ───────────────────────────────────────────────────────────────────

let cachedConfig: AppConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5_000; // 5 seconds

function isCacheValid(): boolean {
  return cachedConfig !== null && Date.now() < cacheExpiry;
}

function updateCache(config: AppConfig): void {
  cachedConfig = config;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
  cacheExpiry = 0;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

function validateEditorConfig(value: any): EditorConfig {
  return {
    command: typeof value?.command === 'string' ? value.command : DEFAULT_EDITOR.command,
    args: Array.isArray(value?.args) ? value.args.filter((a: any) => typeof a === 'string') : DEFAULT_EDITOR.args,
    wait: typeof value?.wait === 'boolean' ? value.wait : DEFAULT_EDITOR.wait,
  };
}

function validateDiffConfig(value: any): DiffConfig {
  return {
    contextLines: typeof value?.contextLines === 'number' && value.contextLines >= 0
      ? value.contextLines : DEFAULT_DIFF.contextLines,
    maxLines: typeof value?.maxLines === 'number' && value.maxLines > 0
      ? value.maxLines : DEFAULT_DIFF.maxLines,
    showLineNumbers: typeof value?.showLineNumbers === 'boolean'
      ? value.showLineNumbers : DEFAULT_DIFF.showLineNumbers,
  };
}

function validateAgentConfig(value: any): AgentConfig {
  return {
    recursionLimit: typeof value?.recursionLimit === 'number' && value.recursionLimit > 0
      ? value.recursionLimit : DEFAULT_AGENT.recursionLimit,
    maxRetries: typeof value?.maxRetries === 'number' && value.maxRetries >= 0
      ? value.maxRetries : DEFAULT_AGENT.maxRetries,
    retryDelayMs: typeof value?.retryDelayMs === 'number' && value.retryDelayMs >= 0
      ? value.retryDelayMs : DEFAULT_AGENT.retryDelayMs,
    stream: typeof value?.stream === 'boolean' ? value.stream : DEFAULT_AGENT.stream,
  };
}

function validateUIConfig(value: any): UIConfig {
  return {
    messageMaxWidth: typeof value?.messageMaxWidth === 'number' && value.messageMaxWidth > 0
      ? value.messageMaxWidth : DEFAULT_UI.messageMaxWidth,
    codeBlockMaxHeight: typeof value?.codeBlockMaxHeight === 'number' && value.codeBlockMaxHeight > 0
      ? value.codeBlockMaxHeight : DEFAULT_UI.codeBlockMaxHeight,
    spinnerIntervalMs: typeof value?.spinnerIntervalMs === 'number' && value.spinnerIntervalMs > 0
      ? value.spinnerIntervalMs : DEFAULT_UI.spinnerIntervalMs,
    theme: isValidThemeMode(value?.theme) ? value.theme : DEFAULT_UI.theme,
  };
}

function validateConfig(raw: any): AppConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG };
  return {
    editor: validateEditorConfig(raw.editor),
    diff: validateDiffConfig(raw.diff),
    agent: validateAgentConfig(raw.agent),
    ui: validateUIConfig(raw.ui),
    version: typeof raw.version === 'number' ? raw.version : DEFAULT_CONFIG.version,
  };
}

// ─── Migrations ──────────────────────────────────────────────────────────────

const MIGRATIONS: Record<number, (config: any) => any> = {
  // Reserved for future schema migrations
  // Example: 2: (config) => ({ ...config, newField: config.oldField ?? defaultValue })
};

function migrateConfig(raw: any): any {
  let current = raw;
  const currentVersion = typeof current?.version === 'number' ? current.version : 0;
  const targetVersion = DEFAULT_CONFIG.version;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    const migrator = MIGRATIONS[v];
    if (migrator) {
      current = migrator(current);
      current.version = v;
    }
  }

  if (currentVersion < targetVersion) {
    current.version = targetVersion;
  }

  return current;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getDefaultConfig(): AppConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export async function loadConfig(): Promise<AppConfig> {
  if (isCacheValid() && cachedConfig) {
    return cachedConfig;
  }

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const raw = JSON.parse(data);
    const migrated = migrateConfig(raw);
    const config = validateConfig(migrated);
    updateCache(config);
    return config;
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      await logError(`Failed to load config: ${error}`);
    }
    const defaults = getDefaultConfig();
    updateCache(defaults);
    return defaults;
  }
}

export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  try {
    const current = await loadConfig();
    const merged = {
      ...current,
      ...config,
      editor: { ...current.editor, ...config.editor },
      diff: { ...current.diff, ...config.diff },
      agent: { ...current.agent, ...config.agent },
      ui: { ...current.ui, ...config.ui },
    };
    const validated = validateConfig(merged);
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(validated, null, 2));
    updateCache(validated);
    await logInfo('Configuration saved successfully');
  } catch (error) {
    await logError(`Failed to save config: ${error}`);
  }
}

export async function updateConfigSection<K extends keyof AppConfig>(
  section: K,
  values: Partial<AppConfig[K]>,
): Promise<AppConfig> {
  const current = await loadConfig();
  const updated = {
    ...current,
    [section]: {
      ...(current[section] as any),
      ...(values as any),
    },
  };
  await saveConfig(updated);
  return updated;
}

export async function resetConfig(): Promise<AppConfig> {
  const defaults = getDefaultConfig();
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaults, null, 2));
    updateCache(defaults);
    await logInfo('Configuration reset to defaults');
  } catch (error) {
    await logError(`Failed to reset config: ${error}`);
  }
  return defaults;
}

export async function getConfigValue<K extends keyof AppConfig>(
  key: K,
): Promise<AppConfig[K]> {
  const config = await loadConfig();
  return config[key];
}
