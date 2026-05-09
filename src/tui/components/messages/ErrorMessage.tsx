import { Box, Text } from 'ink';
import { themeColor } from '@tui/theme.js';
import { CROSS } from '@tui/figures.js';

type Props = {
  text: string;
};

export const ErrorMessage = ({ text }: Props) => {
  const error = themeColor('error');
  return (
    <Box flexDirection="row" marginTop={1}>
      <Box minWidth={2}>
        <Text color={error} bold>
          {CROSS}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {text.split('\n').map((line, idx) => (
          <Text key={idx} color={error}>
            {line}
          </Text>
        ))}
      </Box>
    </Box>
  );
};
