import { Box, Text } from 'ink';

export const ContextMenu = ({ items }: { items: string[] }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginTop={1}
    >
      <Text>Context Set ({items.length})</Text>
      {items.length === 0 ? (
        <Text dimColor>No context yet. Use @path in your prompt or /context add &lt;path&gt;.</Text>
      ) : (
        items.map((p) => (
          <Box key={p}><Text>• {p}</Text></Box>
        ))
      )}
      <Box marginTop={1}><Text dimColor>Tip: "/context remove &lt;path&gt;" or "/context clear"</Text></Box>
    </Box>
  );
};
