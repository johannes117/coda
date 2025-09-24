import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { BaseMessage } from '@langchain/core/messages';
import type { ModelConfig } from '../types/index.js';
import { logError } from './logger.js';

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

export async function storeApiKey(key: string): Promise<void> {
  await ensureStorageDirs();
  const authData = { 'openrouter-api-key': key };
  try {
    await fs.writeFile(AUTH_FILE, JSON.stringify(authData, null, 2), {
      mode: 0o600,
    });
  } catch (error) {
    await logError(`Failed to store API key: ${error}`);
  }
}

export async function getStoredApiKey(): Promise<string | null> {
  try {
    const data = await fs.readFile(AUTH_FILE, 'utf-8');
    const authData = JSON.parse(data);
    return authData['openrouter-api-key'] || null;
  } catch (error) {
    return null;
  }
}

export async function deleteStoredApiKey(): Promise<void> {
  try {
    await fs.unlink(AUTH_FILE);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      await logError(`Failed to delete API key: ${error}`);
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
    if (stored && typeof stored.name === 'string' && typeof stored.effort === 'string') {
      return { name: stored.name, effort: stored.effort };
    }
    return null;
  } catch (error) {
    return null;
  }
}

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
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}
