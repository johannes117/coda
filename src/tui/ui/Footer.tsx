import { Box, Text } from 'ink';
import { useStore } from '../../store/index.js';
import type { Mode } from '../../types/index.js';

const useBlink = () => useStore((s) => s.blink);

export const Footer = ({ working, mode }: { working: boolean; mode: Mode }) => {
  const blink = useBlink();
  const busy = useStore((s) => s.busy);
  return (
    <Box
      width="100%"
      marginTop={1}
      justifyContent="space-between"
      alignItems="center"
    >
      <Text>
        <Text dimColor>{busy ? (blink ? 'working..' : 'working.') : ''}</Text>
        {busy ? <Text dimColor>{' '}</Text> : null}
        <Text dimColor>esc</Text>
        <Text> interrupt</Text>
      </Text>
      <Text dimColor>
        coda v0.1.0 ~
      </Text>
      <Text>
        <Text dimColor>tab | </Text>
        <Text bold>{mode === 'agent' ? 'AGENT MODE' : 'PLAN MODE'}</Text>
      </Text>
    </Box>
  );
};