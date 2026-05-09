import { Box } from 'ink';
import { UserMessage } from './messages/UserMessage.js';
import { AssistantMessage } from './messages/AssistantMessage.js';
import { SystemMessage } from './messages/SystemMessage.js';
import { ErrorMessage } from './messages/ErrorMessage.js';
import { ToolUseMessage } from './messages/ToolUseMessage.js';
import type { Message as MessageType, Chunk } from '@types';

type Props = {
  message: MessageType;
};

const renderChunk = (chunk: Chunk, idx: number, author: MessageType['author'], timestamp?: string) => {
  if (chunk.kind === 'tool-execution') {
    return <ToolUseMessage key={chunk.toolCallId ?? idx} chunk={chunk} />;
  }
  if (chunk.kind === 'error') {
    return <ErrorMessage key={idx} text={chunk.text ?? ''} />;
  }
  if (chunk.kind === 'list' || chunk.kind === 'code') {
    const lines = chunk.lines ?? [];
    const text = '```\n' + lines.join('\n') + '\n```';
    return <AssistantMessage key={idx} text={text} />;
  }
  // text
  const text = chunk.text ?? '';
  if (author === 'user') {
    return <UserMessage key={idx} text={text} timestamp={timestamp} />;
  }
  if (author === 'agent') {
    return <AssistantMessage key={idx} text={text} />;
  }
  // system / tool authors fall back to system styling
  return <SystemMessage key={idx} text={text} />;
};

export const Message = ({ message }: Props) => {
  return (
    <Box flexDirection="column">
      {message.chunks.map((chunk, idx) =>
        renderChunk(chunk, idx, message.author, message.timestamp),
      )}
    </Box>
  );
};
