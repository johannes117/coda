import { Box, Text } from 'ink';

export const ToolCall = ({ tool, input }: { tool: string; input: any }) => (
  <Box flexDirection="column" borderStyle="round" paddingX={1} borderColor="yellow" marginY={1}>
    <Text color="yellow" dimColor>Using tool: {tool}</Text>
    <Text color="gray">{JSON.stringify(input, null, 2)}</Text>
  </Box>
);