import { Box, Text } from 'ink';

export const ToolResult = ({ result }: { result: string }) => (
  <Box flexDirection="column" borderStyle="single" paddingX={1} borderColor="gray" marginY={1}>
    <Text dimColor>Tool Output:</Text>
    <Text color="gray">{result}</Text>
  </Box>
);