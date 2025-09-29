import { Box, Text } from 'ink';
import { BubblePrefix } from './BubblePrefix.js';
import type { Message } from '@types';
import { ToolExecution } from './ToolExecution.js';

export const MessageView = ({ msg }: { msg: Message }) => (
  <Box flexDirection="column" marginTop={1}>
    {msg.chunks.map((chunk, index) => {
      if (chunk.kind === 'tool-execution') {
        return <ToolExecution key={chunk.toolCallId || index} chunk={chunk} />;
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

