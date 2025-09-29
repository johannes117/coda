import { Message, Chunk, ToolExecutionStatus } from "@types";
import { BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { saveSession } from "@lib/storage";

export const processStreamUpdate = async (
    chunk: Record<string, any>,
    conversationHistory: { current: BaseMessage[] },
    actions: {
      push: (message: Omit<Message, 'id'>) => void;
      updateToolExecution: (toolCallId: string, status: ToolExecutionStatus, output: string) => void;
      updateTokenUsage: (usage: { input: number; output: number }) => void;
    }
  ) => {
    const nodeName = Object.keys(chunk)[0]; // Gets the name of the node that sent the chunk: tools | agent
    const update = chunk[nodeName as keyof typeof chunk]; // Gets the payload from that node.
    if (update && 'messages' in update && update.messages) {
      const newMessages: BaseMessage[] = update.messages;
      conversationHistory.current.push(...newMessages);
      await saveSession('last_session', conversationHistory.current);
      for (const message of newMessages) {
        if (message.getType() === 'ai') {
          const aiMessage = message as AIMessage;
          if (aiMessage.usage_metadata) {
            actions.updateTokenUsage({
              input: aiMessage.usage_metadata.input_tokens,
              output: aiMessage.usage_metadata.output_tokens,
            });
          }
          if (aiMessage.content) {
            actions.push({
              author: 'agent',
              chunks: [{ kind: 'text', text: aiMessage.content as string }],
            });
          }
          if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            const toolExecutionChunks: Chunk[] = aiMessage.tool_calls.map((toolCall) => ({
              kind: 'tool-execution',
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              toolArgs: toolCall.args,
              status: 'running',
            }));
            actions.push({
              author: 'system',
              chunks: toolExecutionChunks,
            });
          }
        } else if (message.getType() === 'tool') {
          const toolMessage = message as ToolMessage;
          const output = toolMessage.content as string;
          const isError = output.toLowerCase().startsWith('error');
          actions.updateToolExecution(toolMessage.tool_call_id, isError ? 'error' : 'success', output);
        }
      }
    }
  };