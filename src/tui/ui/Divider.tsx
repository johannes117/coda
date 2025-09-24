import { Box, Text } from 'ink';

export const Divider = () => (
  <Box marginY={0}>
    <Text color="gray">{'─'.repeat(80)}</Text>
  </Box>
);