import { createMiddleware } from 'langchain';
import { ToolMessage } from '@langchain/core/messages';
import { isGraphInterrupt } from '@langchain/langgraph';

// deepagents always installs a wrapToolCall middleware, which makes langchain's
// ToolNode classify every tool failure as a "middleware error". The ToolNode's
// default handleToolErrors is a function (not the literal `true`), so those
// middleware errors are re-thrown rather than fed back to the model — a single
// malformed tool call (e.g. args that fail Zod validation) then crashes the
// whole stream. createDeepAgent/createAgent don't expose handleToolErrors, so
// we recover one layer up: catch tool errors here and return them as a
// ToolMessage so the agent sees the failure and can correct the call.
export const toolErrorRecoveryMiddleware = createMiddleware({
  name: 'ToolErrorRecovery',
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      // Interrupts (human-in-the-loop) and aborts are not recoverable by the
      // agent and must keep bubbling up.
      if (isGraphInterrupt(error)) throw error;
      if (request.runtime.signal?.aborted) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      return new ToolMessage({
        content: `Error: ${detail}\nPlease fix the tool call arguments and try again.`,
        tool_call_id: request.toolCall.id ?? '',
        name: request.toolCall.name,
        status: 'error',
      });
    }
  },
});
