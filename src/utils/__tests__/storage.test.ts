import { describe, it, expect, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

async function withTempHome<T>(fn: (homeDir: string, storage: typeof import('../storage.js')) => Promise<T>): Promise<T> {
  const tempHome = path.join(process.cwd(), `.tmp-home-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fs.rm(tempHome, { recursive: true, force: true });
  await fs.mkdir(tempHome, { recursive: true });
  try {
    vi.stubEnv('HOME', tempHome);
    vi.resetModules();
    const storage = await import('../storage.js');
    return await fn(tempHome, storage);
  } finally {
    vi.unstubAllEnvs();
    await fs.rm(tempHome, { recursive: true, force: true });
  }
}

describe('storage utils', () => {
  it('stores, reads, and deletes the API key', async () => {
    await withTempHome(async (home, storage) => {
      const authPath = path.join(home, '.coda', 'auth.json');

      await expect(storage.getStoredApiKey()).resolves.toBeNull();

      await storage.storeApiKey('sk-test-123');
      const contents = JSON.parse(await fs.readFile(authPath, 'utf-8'));
      expect(contents['openrouter-api-key']).toBe('sk-test-123');
      await expect(storage.getStoredApiKey()).resolves.toBe('sk-test-123');

      await storage.deleteStoredApiKey();
      await expect(storage.getStoredApiKey()).resolves.toBeNull();

      await storage.deleteStoredApiKey();
      await expect(storage.getStoredApiKey()).resolves.toBeNull();
    });
  });

  it('stores and retrieves model configuration; missing returns null', async () => {
    await withTempHome(async (home, storage) => {
      const configPath = path.join(home, '.coda', 'config.json');

      await expect(storage.getStoredModelConfig()).resolves.toBeNull();

      const modelConfig = { name: 'openrouter/some-model', effort: 'medium' } as const;
      await storage.storeModelConfig(modelConfig);
      const raw = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      expect(raw.modelConfig).toEqual(modelConfig);
      await expect(storage.getStoredModelConfig()).resolves.toEqual(modelConfig);
    });
  });

  it('saves and loads sessions; missing session returns empty array', async () => {
    await withTempHome(async (home, storage) => {
      const sessionId = 'abc123';
      const sessionPath = path.join(home, '.coda', 'sessions', `${sessionId}.json`);

      await expect(storage.loadSession(sessionId)).resolves.toEqual([]);

      const history = [
        { type: 'human', content: 'Hello' },
        { type: 'ai', content: 'Hi there!' },
      ];
      await storage.saveSession(sessionId, history as any);
      const saved = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
      expect(saved).toEqual(history);

      await expect(storage.loadSession(sessionId)).resolves.toEqual(history);
    });
  });
});
