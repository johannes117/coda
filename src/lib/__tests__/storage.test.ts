import { describe, it, expect, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

async function withTempHome<T>(fn: (homeDir: string, storage: typeof import('../storage.js')) => Promise<T>): Promise<T> {
  const base = path.join(process.cwd(), '.tmp');
  const tempHome = path.join(base, `home-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fs.mkdir(base, { recursive: true });
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
  it('stores, reads, and deletes API keys by provider', async () => {
    await withTempHome(async (home, storage) => {
      const authPath = path.join(home, '.coda', 'auth.json');

      await expect(storage.getStoredApiKey('openai')).resolves.toBeNull();
      await expect(storage.getStoredApiKey('anthropic')).resolves.toBeNull();

      await storage.storeApiKey('openai', 'sk-openai-123');
      const contents1 = JSON.parse(await fs.readFile(authPath, 'utf-8'));
      expect(contents1['openai']).toBe('sk-openai-123');
      await expect(storage.getStoredApiKey('openai')).resolves.toBe('sk-openai-123');

      await storage.storeApiKey('anthropic', 'sk-ant-456');
      const contents2 = JSON.parse(await fs.readFile(authPath, 'utf-8'));
      expect(contents2['openai']).toBe('sk-openai-123');
      expect(contents2['anthropic']).toBe('sk-ant-456');

      await storage.deleteStoredApiKey('openai');
      await expect(storage.getStoredApiKey('openai')).resolves.toBeNull();
      await expect(storage.getStoredApiKey('anthropic')).resolves.toBe('sk-ant-456');

      await storage.deleteAllApiKeys();
      await expect(storage.getStoredApiKey('anthropic')).resolves.toBeNull();
    });
  });

  it('retrieves all API keys at once', async () => {
    await withTempHome(async (home, storage) => {
      await storage.storeApiKey('openai', 'sk-openai');
      await storage.storeApiKey('fireworks', 'fw_fireworks');

      const keys = await storage.getStoredApiKeys();
      expect(keys.openai).toBe('sk-openai');
      expect(keys.fireworks).toBe('fw_fireworks');
      expect(keys.anthropic).toBeUndefined();
    });
  });

  it('stores and retrieves model configuration; missing returns null', async () => {
    await withTempHome(async (home, storage) => {
      const configPath = path.join(home, '.coda', 'config.json');

      await expect(storage.getStoredModelConfig()).resolves.toBeNull();

      const modelConfig = { name: 'gpt-5.5', provider: 'openai', effort: 'medium' } as const;
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

  it('saves and loads session envelopes with metadata', async () => {
    await withTempHome(async (home, storage) => {
      const sessionId = 'sesh-1';
      const modelConfig = { name: 'claude-opus-4-8', provider: 'anthropic' as const, effort: 'high' as const };
      const tokenUsage = { input: 100, output: 50, total: 150 };
      const history = [
        { type: 'human', content: 'Fix the bug' },
        { type: 'ai', content: 'Done!' },
      ] as any;
      const uiMessages = [
        { id: 'm1', author: 'user', chunks: [{ kind: 'text', text: 'Fix the bug' }] },
        { id: 'm2', author: 'agent', chunks: [{ kind: 'text', text: 'Done!' }] },
      ] as any;

      await storage.saveSessionEnvelope(
        sessionId, history, uiMessages, modelConfig, tokenUsage,
        'Fix the bug', '2025-01-01T00:00:00.000Z',
      );

      const loaded = await storage.loadSessionEnvelope(sessionId);
      expect(loaded).not.toBeNull();
      expect(loaded!.sessionId).toBe(sessionId);
      expect(loaded!.firstPrompt).toBe('Fix the bug');
      expect(loaded!.modelConfig).toEqual(modelConfig);
      expect(loaded!.tokenUsage).toEqual(tokenUsage);
      expect(loaded!.messages).toEqual(history);
      expect(loaded!.uiMessages).toEqual(uiMessages);
    });
  });

  it('lists sessions most-recent first', async () => {
    await withTempHome(async (_home, storage) => {
      const modelConfig = { name: 'claude-opus-4-8', provider: 'anthropic' as const, effort: 'high' as const };
      const tokenUsage = { input: 0, output: 0, total: 0 };
      const history = [] as any;
      const uiMessages = [] as any;

      // Save three sessions with different createdAt/updatedAt timestamps.
      // saveSessionEnvelope stamps updatedAt to "now", so we save them in
      // order with small delays is impractical — instead we verify sorting
      // by writing files directly with known timestamps.
      const { promises: fs2 } = await import('fs');
      const path2 = (await import('path')).default;
      const sessionsDir = path2.join(process.env.HOME!, '.coda', 'sessions');
      await fs2.mkdir(sessionsDir, { recursive: true });

      const sessions = [
        { sessionId: 'old', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', firstPrompt: 'old prompt', modelConfig, tokenUsage, messages: [], uiMessages: [] },
        { sessionId: 'new', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-03-01T00:00:00Z', firstPrompt: 'new prompt', modelConfig, tokenUsage, messages: [], uiMessages: [] },
        { sessionId: 'mid', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-02-01T00:00:00Z', firstPrompt: 'mid prompt', modelConfig, tokenUsage, messages: [], uiMessages: [] },
      ];

      for (const s of sessions) {
        await fs2.writeFile(
          path2.join(sessionsDir, `${s.sessionId}.json`),
          JSON.stringify(s, null, 2),
        );
      }

      const metas = await storage.listSessions();
      expect(metas).toHaveLength(3);
      expect(metas[0].sessionId).toBe('new');
      expect(metas[1].sessionId).toBe('mid');
      expect(metas[2].sessionId).toBe('old');
      expect(metas[0].firstPrompt).toBe('new prompt');
      expect(metas[0].messageCount).toBe(0);
    });
  });

  it('returns null for missing session envelope', async () => {
    await withTempHome(async (_home, storage) => {
      await expect(storage.loadSessionEnvelope('nonexistent')).resolves.toBeNull();
    });
  });
});
