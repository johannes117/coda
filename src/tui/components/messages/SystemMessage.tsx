import { Box, Text } from 'ink';
import { themeColor } from '@tui/theme.js';
import { BULLET } from '@tui/figures.js';

type Props = {
  text: string;
};

export const SystemMessage = ({ text }: Props) => {
  if (!text.trim()) return null;
  const subtle = themeColor('subtle');
  return (
    <Box flexDirection="row" marginTop={1}>
      <Box minWidth={2}>
        <Text color={subtle}>{BULLET}</Text>
      </Box>
      <Text color={themeColor('inactive')}>{text}</Text>
    </Box>
  );
};
