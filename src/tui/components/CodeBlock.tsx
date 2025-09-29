import { Box, Text } from 'ink';
import type { CodeBlockProps } from '@types';

export const CodeBlock = ({ lines }: CodeBlockProps) => (
  <Box flexDirection="column" borderStyle="round" paddingX={1} borderColor="gray">
    {lines.map((line, idx) => (
      <Text key={idx} dimColor>{line}</Text>
    ))}
  </Box>
);
