import { describe, it, expect } from 'vitest';
import { ToolMessage } from '@langchain/core/messages';
import { toolErrorRecoveryMiddleware } from '@agent/tool-error-middleware.js';

const wrapToolCall = toolErrorRecoveryMiddleware.wrapToolCall;
if (!wrapToolCall) {
  throw new Error('toolErrorRecoveryMiddleware must define wrapToolCall');
}

type WrapArgs = Parameters<typeof wrapToolCall>;

function makeRequest(aborted = false): WrapArgs[0] {
  const controller = new AbortController();
  if (aborted) controller.abort();
  return {
    toolCall: { id: 'call_1', name: 'write_todos', args: {} },
    runtime: { signal: controller.signal },
  } as unknown as WrapArgs[0];
}

describe('toolErrorRecoveryMiddleware', () => {
  it('passes successful tool results through unchanged', async () => {
    const ok = new ToolMessage({ content: 'done', tool_call_id: 'call_1' });
    const result = await wrapToolCall(makeRequest(), async () => ok);
    expect(result).toBe(ok);
  });

  it('converts a thrown tool error into a ToolMessage so the agent can recover', async () => {
    const result = await wrapToolCall(makeRequest(), async () => {
      throw new Error('Received tool input did not match expected schema');
    });
    expect(ToolMessage.isInstance(result)).toBe(true);
    if (!ToolMessage.isInstance(result)) return;
    expect(result.status).toBe('error');
    expect(result.tool_call_id).toBe('call_1');
    expect(String(result.content)).toContain('did not match expected schema');
    expect(String(result.content)).toContain('Please fix the tool call arguments');
  });

  it('re-throws when the run was aborted instead of swallowing the error', async () => {
    await expect(
      wrapToolCall(makeRequest(true), async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
