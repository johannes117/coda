import { Box, Text } from 'ink';
import { useStore } from '@app/store.js';
import { modelOptions } from '@lib/models.js';
import { themeColor } from '@tui/theme.js';
import type { Mode, ModelConfig } from '@types';

type Props = {
  mode: Mode;
};

const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

const modeLabel = (mode: Mode): string =>
  mode === 'plan' ? 'plan mode' : 'agent mode';

const modelShortLabel = (modelConfig: ModelConfig): string => {
  const opt = modelOptions.find(
    (o) => o.name === modelConfig.name && o.effort === modelConfig.effort,
  );
  return opt ? opt.label : `${modelConfig.name}·${modelConfig.effort}`;
};

export const StatusLine = ({ mode }: Props) => {
  const tokenUsage = useStore((s) => s.tokenUsage);
  const modelConfig = useStore((s) => s.modelConfig);
  const subtle = themeColor('subtle');
  const inactive = themeColor('inactive');
  const planColor = themeColor('planMode');
  const brand = themeColor('brand');

  const opt = modelOptions.find(
    (o) => o.name === modelConfig.name && o.effort === modelConfig.effort,
  );
  const ctx = opt?.contextWindow ?? 0;
  const ctxLeft = ctx > 0 ? Math.max(0, Math.min(100, Math.round(((ctx - tokenUsage.total) / ctx) * 100))) : null;

  const modeColor = mode === 'plan' ? planColor : brand;

  return (
    <Box width="100%" justifyContent="space-between" paddingX={1}>
      <Box>
        <Text color={inactive}>tab </Text>
        <Text bold color={modeColor}>
          {modeLabel(mode)}
        </Text>
        <Text color={subtle}>  ·  </Text>
        <Text color={inactive}>esc </Text>
        <Text>interrupt</Text>
        <Text color={subtle}>  ·  </Text>
        <Text color={inactive}>/ </Text>
        <Text>commands</Text>
      </Box>
      <Box>
        <Text color={subtle}>{modelShortLabel(modelConfig)}</Text>
        {tokenUsage.total > 0 ? (
          <>
            <Text color={subtle}>  ·  </Text>
            <Text color={subtle}>{formatTokens(tokenUsage.total)} tokens</Text>
          </>
        ) : null}
        {ctxLeft !== null && tokenUsage.total > 0 ? (
          <>
            <Text color={subtle}>  ·  </Text>
            <Text color={subtle}>{ctxLeft}% ctx</Text>
          </>
        ) : null}
      </Box>
    </Box>
  );
};
