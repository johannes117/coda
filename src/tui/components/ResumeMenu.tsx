import { Box, Text } from 'ink';
import { themeColor } from '@tui/theme.js';
import { ARROW_RIGHT } from '@tui/figures.js';
import type { SessionMenuItem } from '@types';

type Props = {
  items: SessionMenuItem[];
  selectedIndex: number;
};

export const ResumeMenu = ({ items, selectedIndex }: Props) => {
  const subtle = themeColor('subtle');
  const inactive = themeColor('inactive');
  const suggestion = themeColor('suggestion');

  if (items.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1} marginTop={0}>
        <Text color={subtle}>No previous conversations found.</Text>
        <Box marginTop={1}>
          <Text color={subtle}>esc to close</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} marginTop={0}>
      {items.map((item, index) => {
        const isSelected = selectedIndex === index;
        return (
          <Box key={item.sessionId}>
            <Text color={isSelected ? suggestion : inactive}>
              {isSelected ? `${ARROW_RIGHT} ` : '  '}
            </Text>
            <Text bold color={isSelected ? suggestion : undefined}>
              {item.label}
            </Text>
            <Text color={subtle}>{`  (${item.detail})`}</Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text color={subtle}>
          ↑/↓ to navigate · enter to resume · esc to close
        </Text>
      </Box>
    </Box>
  );
};