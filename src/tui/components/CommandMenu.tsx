import { Box, Text } from 'ink';
import type { SlashCommand } from '@types';

type Props = {
  commands: SlashCommand[];
  selectedIndex: number;
};

export const CommandMenu = ({ commands, selectedIndex }: Props) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginTop={1}
    >
      {commands.map((command, index) => {
        const isSelected = selectedIndex === index;
        return (
          <Box key={command.name}>
            <Text color={isSelected ? 'cyan' : undefined}>
              {isSelected ? '❯ ' : '  '}
              <Text bold color={isSelected ? 'cyan' : undefined}>
                {`/${command.name}`}
              </Text>
              <Text dimColor>{` - ${command.description}`}</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

