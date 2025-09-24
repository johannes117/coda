import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import type { Mode } from '../../types/index.js';

const useBlink = () => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn(v => !v), 600);
    return () => clearInterval(id);
  }, []);
  return on;
};

export const Footer = ({ working, mode }: { working: boolean; mode: Mode }) => {
  const blink = useBlink();
  return (
    <Box
      width="100%"
      marginTop={1}
      justifyContent="space-between"
      alignItems="center"
    >
      <Text>
        <Text dimColor>{working ? (blink ? 'working..' : 'working.') : ''}</Text>
        {working ? <Text dimColor>{' '}</Text> : null}
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