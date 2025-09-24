import { Box, Text } from 'ink';

export const DiffView = ({ diff }: { diff: string }) => {
  if (!diff) return null;
  const lines = diff.split('\n');

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginTop={1}
    >
      {lines.map((line, index) => {
        let color = 'gray';
        if (line.startsWith('+')) {
          color = 'green';
        } else if (line.startsWith('-')) {
          color = 'red';
        }
        return (
          <Text key={index} color={color}>
            {line}
          </Text>
        );
      })}
    </Box>
  );
};