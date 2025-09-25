import { Box, Text } from 'ink';
import { Divider } from './Divider.js';
import { CodeBlock } from './CodeBlock.js';
import { ErrorLine } from './ErrorLine.js';
import { StatusLine } from './StatusLine.js';
import { BubblePrefix } from './BubblePrefix.js';
import type { Message } from '@types';
import { ToolExecution } from './ToolExecution.js';

export const MessageView = ({ msg }: { msg: Message }) => (
  <Box flexDirection="column" marginTop={1}>
    {msg.chunks.map((c, i) => {
      if (c.kind === 'divider') return <Divider key={i} />;
      if (c.kind === 'code') return <CodeBlock key={i} lines={c.lines ?? []} />;
      if (c.kind === 'error') return <ErrorLine key={i} text={c.text ?? ''} />;
      if (c.kind === 'status') return <StatusLine key={i} text={c.text ?? ''} />;
      if (c.kind === 'tool-execution') {
        return <ToolExecution key={c.toolCallId || i} chunk={c} />;
      }
      if (c.kind === 'list') {
        return <CodeBlock key={i} lines={c.lines ?? []} />;
      }

      return (
        <Box key={i} flexDirection="row">
          <BubblePrefix author={msg.author} />
          <Text>{c.text}</Text>
          {msg.timestamp ? (
            <Text dimColor> ({msg.timestamp})</Text>
          ) : null}
        </Box>
      );
    })}
  </Box>
);

