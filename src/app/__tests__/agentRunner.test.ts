import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseMessage, AIMessage } from '@langchain/core/messages';
import { runAgentStream } from '../agent-runner.js';

vi.mock('@agent/graph', () => {
  return {
    createAgent: vi.fn(() => ({
      stream: async function* () {
        // simulate a single AI response chunk with usage
        const msg = new AIMessage('hello from agent');
        // Set usage_metadata directly on the message
        (msg as any).usage_metadata = { input_tokens: 10, output_tokens: 5 };
        yield { agent: { messages: [msg] } };
      },
    })),
  };
});

vi.mock('@lib/storage', () => ({
  saveSession: vi.fn(async () => {}),
}));

vi.mock('@lib/logger', () => ({
  logError: vi.fn(async () => {}),
}));

describe('runAgentStream', () => {
  const addMessage = vi.fn();
  const updateToolExecution = vi.fn();
  const updateTokenUsage = vi.fn();
  const setBusy = vi.fn();

  beforeEach(() => {
    addMessage.mockReset();
    updateToolExecution.mockReset();
    updateTokenUsage.mockReset();
    setBusy.mockReset();
  });

  it('streams agent messages and updates token usage', async () => {
    const history = { current: [] as BaseMessage[] };
    await runAgentStream(
      {
        apiKey: 'sk-test',
        modelConfig: { name: 'x-ai/grok-4-fast:free', effort: 'medium' },
        addMessage,
        updateToolExecution,
        updateTokenUsage,
        setBusy,
      },
      history,
      'do something'
    );
    expect(addMessage).toHaveBeenCalled();
    // last push should contain agent text
    const calls = addMessage.mock.calls.map((c) => c[0]);
    const hasAgent = calls.some((m) =>
      m.author === 'agent' && m.chunks?.[0]?.text?.includes('hello from agent')
    );
    expect(hasAgent).toBe(true);
    expect(updateTokenUsage).toHaveBeenCalledWith({ input: 10, output: 5 });
    expect(setBusy).toHaveBeenCalledWith(true);
  });
});