import { Box, Text } from 'ink';
import type { FileSearchMenuProps } from '@types';

export const FileSearchMenu = ({ matches, selectedIndex }: FileSearchMenuProps) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginTop={1}
    >
      {matches.length > 0 ? (
        matches.map((match, index) => {
          const isSelected = selectedIndex === index;
          return (
            <Box key={match}>
              <Text color={isSelected ? 'cyan' : undefined}>
                {isSelected ? '❯ ' : '  '}
                <Text bold={isSelected} color={isSelected ? 'cyan' : undefined}>
                  {match}
                </Text>
              </Text>
            </Box>
          );
        })
      ) : (
        <Text dimColor>No file matches found.</Text>
      )}
    </Box>
  );
};