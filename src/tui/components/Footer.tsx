import { Box, Text } from 'ink';
import { useStore } from '@app/store.js';
import type { Mode } from '@types';
import { modelOptions } from '@lib/models.js';

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
  const modelConfig = useStore((s) => s.modelConfig);

  const currentModel = modelOptions.find(
    (o) => o.name === modelConfig.name && o.effort === modelConfig.effort
  );

  const contextWindow = currentModel?.contextWindow ?? 0;
  const contextLeftRaw = contextWindow > 0 ? Math.round((contextWindow - tokenUsage.total) / contextWindow * 100) : 0;
  const contextLeftPercentage = Math.max(0, Math.min(100, contextLeftRaw));
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
        {tokenUsage.total > 0 && contextWindow > 0 && (
          <Text>
            <Text dimColor> | </Text>
            <Text>{contextLeftPercentage}% context left</Text>
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

