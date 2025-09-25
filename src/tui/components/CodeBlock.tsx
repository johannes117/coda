import { Box, Text } from 'ink';

export const CodeBlock = ({ lines }: { lines: string[] }) => (
  <Box flexDirection="column" borderStyle="round" paddingX={1} borderColor="gray">
    {lines.map((line, idx) => (
      <Text key={idx} dimColor>{line}</Text>
    ))}
  </Box>
);

