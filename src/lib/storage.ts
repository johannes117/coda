import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { BaseMessage } from '@langchain/core/messages';
import type { ModelConfig, Provider, ApiKeys, Message, TokenUsage, SessionData, SessionMeta } from '@types';
import { logError } from '@lib/logger';
import { isKnownModelConfig } from '@lib/models.js';

const STORAGE_DIR = path.join(os.homedir(), '.coda');
const AUTH_FILE = path.join(STORAGE_DIR, 'auth.json');
const CONFIG_FILE = path.join(STORAGE_DIR, 'config.json');
const SESSIONS_DIR = path.join(STORAGE_DIR, 'sessions');

async function ensureStorageDirs(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  } catch (error) {
    await logError(`Failed to create storage directories: ${error}`);
  }
}

export async function storeApiKey(provider: Provider, key: string): Promise<void> {
  await ensureStorageDirs();
  try {
    let authData: Record<string, string> = {};
    try {
      const data = await fs.readFile(AUTH_FILE, 'utf-8');
      authData = JSON.parse(data);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    authData[provider] = key;
    await fs.writeFile(AUTH_FILE, JSON.stringify(authData, null, 2), {
      mode: 0o600,
    });
  } catch (error) {
    await logError(`Failed to store API key: ${error}`);
  }
}

export async function getStoredApiKey(provider: Provider): Promise<string | null> {
  try {
    const data = await fs.readFile(AUTH_FILE, 'utf-8');
    const authData = JSON.parse(data);
    return authData[provider] || null;
  } catch (error) {
    return null;
  }
}

export async function getStoredApiKeys(): Promise<ApiKeys> {
  try {
    const data = await fs.readFile(AUTH_FILE, 'utf-8');
    const authData = JSON.parse(data);
    return {
      openai: authData.openai || undefined,
      anthropic: authData.anthropic || undefined,
      fireworks: authData.fireworks || undefined,
    };
  } catch (error) {
    return {};
  }
}

export async function deleteStoredApiKey(provider: Provider): Promise<void> {
  try {
    const data = await fs.readFile(AUTH_FILE, 'utf-8');
    const authData = JSON.parse(data);
    delete authData[provider];
    await fs.writeFile(AUTH_FILE, JSON.stringify(authData, null, 2), {
      mode: 0o600,
    });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      await logError(`Failed to delete API key: ${error}`);
    }
  }
}

export async function deleteAllApiKeys(): Promise<void> {
  try {
    await fs.unlink(AUTH_FILE);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      await logError(`Failed to delete API keys: ${error}`);
    }
  }
}

export async function storeModelConfig(modelConfig: ModelConfig): Promise<void> {
  await ensureStorageDirs();
  try {
    let configData: Record<string, unknown> = {};
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      configData = JSON.parse(data);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    const updated = { ...configData, modelConfig };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(updated, null, 2));
  } catch (error) {
    await logError(`Failed to store model configuration: ${error}`);
  }
}

export async function getStoredModelConfig(): Promise<ModelConfig | null> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const stored = parsed.modelConfig;
    if (stored && typeof stored.name === 'string' && typeof stored.effort === 'string' && typeof stored.provider === 'string') {
      if (!isKnownModelConfig(stored.name, stored.effort)) {
        return null;
      }
      return { name: stored.name, provider: stored.provider, effort: stored.effort };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ── Session persistence ───────────────────────────────────────────────
//
// Each session is stored as a single JSON file under ~/.coda/sessions/.
// The file contains an "envelope" with metadata (timestamps, model config,
// token usage, first prompt) alongside the two parallel message arrays:
//
//   • messages    — the LangChain BaseMessage[] conversation history that
//                   gets fed back to the agent on resume.
//   • uiMessages  — the display-oriented Message[] used by the Zustand
//                   store, so the rendered transcript can be restored
//                   without reconstructing it from BaseMessage[].
//
// Older sessions (pre-envelope) stored a bare BaseMessage[] JSON array.
// loadSession handles both formats transparently.

export async function saveSession(sessionId: string, history: BaseMessage[]): Promise<void> {
  await ensureStorageDirs();
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  try {
    await fs.writeFile(sessionFile, JSON.stringify(history, null, 2));
  } catch (error) {
    await logError(`Failed to save session ${sessionId}: ${error}`);
  }
}

export async function loadSession(sessionId: string): Promise<BaseMessage[]> {
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  try {
    const data = await fs.readFile(sessionFile, 'utf-8');
    const parsed = JSON.parse(data);
    // Envelope format — return the messages array.
    if (parsed && typeof parsed === 'object' && 'sessionId' in parsed) {
      return (parsed as SessionData).messages ?? [];
    }
    // Legacy format — the whole file is a BaseMessage[] array.
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Save a full session envelope (metadata + messages + uiMessages).
 * Callers provide the conversation history and the UI messages; this
 * function stamps the envelope with timestamps and first-prompt metadata.
 */
export async function saveSessionEnvelope(
  sessionId: string,
  history: BaseMessage[],
  uiMessages: Message[],
  modelConfig: ModelConfig,
  tokenUsage: TokenUsage,
  firstPrompt: string,
  createdAt: string,
): Promise<void> {
  await ensureStorageDirs();
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  const now = new Date().toISOString();
  const envelope: SessionData = {
    sessionId,
    createdAt: createdAt || now,
    updatedAt: now,
    modelConfig,
    tokenUsage,
    firstPrompt,
    messages: history,
    uiMessages,
  };
  try {
    await fs.writeFile(sessionFile, JSON.stringify(envelope, null, 2));
  } catch (error) {
    await logError(`Failed to save session envelope ${sessionId}: ${error}`);
  }
}

/**
 * Load a full session envelope (metadata + messages + uiMessages).
 * Returns null if the file doesn't exist or is in the legacy bare-array
 * format (which lacks uiMessages and metadata).
 */
export async function loadSessionEnvelope(sessionId: string): Promise<SessionData | null> {
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  try {
    const data = await fs.readFile(sessionFile, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && 'sessionId' in parsed) {
      return parsed as SessionData;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * List all saved sessions, most-recent first.
 * Reads only the metadata portion of each file (sessionId, timestamps,
 * firstPrompt, modelConfig, messageCount) — not the full message arrays —
 * so the picker stays fast even with many large sessions.
 */
export async function listSessions(): Promise<SessionMeta[]> {
  await ensureStorageDirs();
  try {
    const files = await fs.readdir(SESSIONS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const metas: SessionMeta[] = [];
    for (const file of jsonFiles) {
      const filePath = path.join(SESSIONS_DIR, file);
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object' && 'sessionId' in parsed) {
          const env = parsed as SessionData;
          metas.push({
            sessionId: env.sessionId,
            createdAt: env.createdAt ?? '',
            updatedAt: env.updatedAt ?? '',
            firstPrompt: env.firstPrompt ?? '',
            modelConfig: env.modelConfig,
            tokenUsage: env.tokenUsage ?? { input: 0, output: 0, total: 0 },
            messageCount: env.uiMessages?.length ?? env.messages?.length ?? 0,
          });
        }
      } catch {
        // Skip corrupt or unreadable files.
      }
    }
    // Sort by updatedAt descending (most recent first).
    metas.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return metas;
  } catch (error) {
    await logError(`Failed to list sessions: ${error}`);
    return [];
  }
}

/**
 * Delete a session file by ID.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  try {
    await fs.unlink(sessionFile);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      await logError(`Failed to delete session ${sessionId}: ${error}`);
    }
  }
}

