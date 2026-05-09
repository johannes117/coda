import { Box, Text } from 'ink';
import { themeColor } from '@tui/theme.js';
import { ARROW_RIGHT_THIN } from '@tui/figures.js';

type Props = {
  text: string;
  timestamp?: string;
};

export const UserMessage = ({ text, timestamp }: Props) => {
  const subtle = themeColor('subtle');
  const inactive = themeColor('inactive');
  const lines = text.split('\n');
  return (
    <Box flexDirection="column" marginTop={1}>
      {lines.map((line, idx) => (
        <Box key={idx} flexDirection="row">
          <Text color={inactive}>{idx === 0 ? `${ARROW_RIGHT_THIN} ` : '  '}</Text>
          <Text color={themeColor('text')}>{line}</Text>
          {idx === 0 && timestamp ? (
            <Text color={subtle}> ({timestamp})</Text>
          ) : null}
        </Box>
      ))}
    </Box>
  );
};
