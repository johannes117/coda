import { Box, Text } from 'ink';
import { useStore } from '@tui/state';
import type { Mode } from '@types';

const useBlink = () => useStore((s) => s.blink);

const formatTokenCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const Footer = ({ working, mode }: { working: boolean; mode: Mode }) => {
  const blink = useBlink();
  const busy = useStore((s) => s.busy);
  const tokenUsage = useStore((s) => s.tokenUsage);
  return (
    <Box
      width="100%"
      marginTop={1}
      justifyContent="space-between"
      alignItems="center"
    >
      <Text>
        <Text dimColor>{busy ? (blink ? 'working..' : 'working. ') : ''}</Text>
        {busy ? <Text dimColor>{' '}</Text> : null}
        <Text dimColor>esc</Text>
        <Text> interrupt</Text>
        {tokenUsage.total > 0 && (
          <Text>
            <Text dimColor> | tokens used: </Text>
            <Text>{formatTokenCount(tokenUsage.total)}</Text>
          </Text>
        )}
      </Text>
      <Text dimColor>coda v0.1.0 ~</Text>
      <Text>
        <Text dimColor>tab | </Text>
        <Text bold>{mode === 'agent' ? 'AGENT MODE' : 'PLAN MODE'}</Text>
      </Text>
    </Box>
  );
};

