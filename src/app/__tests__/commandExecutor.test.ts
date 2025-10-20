import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSlashCommand } from '../command-executor.js';
import { useStore } from '../store.js';

// use actual store but reset state each test
const initial = useStore.getState();

describe('executeSlashCommand', () => {
  beforeEach(() => {
    useStore.setState(initial, true);
  });

  const deps = {
    apiKey: 'sk-test',
    modelConfig: { name: 'anthropic/claude-sonnet-4', effort: 'medium' },
    addMessage: vi.fn(),
    updateToolExecution: vi.fn(),
    updateTokenUsage: vi.fn(),
    setBusy: vi.fn(),
  };

  const ctxBase = () => ({
    addMessage: vi.fn(),
    resetMessages: vi.fn(),
    clearApiKeyStore: vi.fn(),
    setShowModelMenu: vi.fn(),
    setFilteredModels: vi.fn(),
    setModelSelectionIndex: vi.fn(),
    setQuery: vi.fn(),
    exit: vi.fn(),
    apiKey: 'sk-test',
    currentModel: { name: 'anthropic/claude-sonnet-4', effort: 'medium' },
    sessionId: 'sess-1',
  });

  it('/help pushes a commands list', async () => {
    const ctx = ctxBase();
    const handled = await executeSlashCommand('help', deps as any, ctx as any);
    expect(handled).toBe(true);
    const calls = (ctx.addMessage as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const arg = calls[0][0];
    expect(arg.chunks?.[0]?.kind).toBe('list');
  });

  it('/status pushes a status block', async () => {
    const ctx = ctxBase();
    const handled = await executeSlashCommand('status', deps as any, ctx as any);
    expect(handled).toBe(true);
    const arg = (ctx.addMessage as any).mock.calls[0][0];
    expect(arg.author).toBe('system');
    expect(arg.chunks?.[0]?.text).toContain('Status:');
  });

  it('/model triggers model menu open', async () => {
    const ctx = ctxBase();
    const handled = await executeSlashCommand('model', deps as any, ctx as any);
    expect(handled).toBe(true);
    expect(ctx.setShowModelMenu).toHaveBeenCalledWith(true);
  });

});