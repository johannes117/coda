import { Box, Text } from 'ink';
import { Markdown } from '../Markdown.js';
import { themeColor } from '@tui/theme.js';
import { BLACK_CIRCLE } from '@tui/figures.js';

type Props = {
  text: string;
};

export const AssistantMessage = ({ text }: Props) => {
  if (!text.trim()) return null;
  return (
    <Box flexDirection="row" marginTop={1}>
      <Box minWidth={2}>
        <Text color={themeColor('brand')} bold>
          {BLACK_CIRCLE}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        <Markdown>{text}</Markdown>
      </Box>
    </Box>
  );
};
