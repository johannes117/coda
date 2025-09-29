import { Box, Text } from 'ink';
import { BubblePrefix } from './BubblePrefix.js';
import { CodeBlock } from './CodeBlock.js';
import type { MessageViewProps } from '@types';
import { ToolExecution } from './ToolExecution.js';

export const MessageView = ({ msg }: MessageViewProps) => (
  <Box flexDirection="column" marginTop={1}>
    {msg.chunks.map((chunk, index) => {
      if (chunk.kind === 'tool-execution') {
        return <ToolExecution key={chunk.toolCallId || index} chunk={chunk} />;
      }
      if (chunk.kind === 'error') {
        return <Text color="red">{chunk.text}</Text>;
      }
      if (chunk.kind === 'list' || chunk.kind === 'code') {
        return <CodeBlock lines={chunk.lines ?? []} key={index} />;
      }
      return (
        <Box key={index} flexDirection="row">
          <BubblePrefix author={msg.author} />
          <Text>{chunk.text}</Text>
          {msg.timestamp ? (
            <Text dimColor> ({msg.timestamp})</Text>
          ) : null}
        </Box>
      );
    })}
  </Box>
);
