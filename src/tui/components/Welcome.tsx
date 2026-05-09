import { Box, Text } from 'ink';
import path from 'path';
import { Logo } from './Logo.js';
import { themeColor } from '@tui/theme.js';
import { TEARDROP_ASTERISK } from '@tui/figures.js';
import type { ModelConfig } from '@types';

type Props = {
  modelConfig: ModelConfig;
  cwd?: string;
};

const homePrefix = (p: string): string => {
  const home = process.env.HOME ?? '';
  if (home && p.startsWith(home)) {
    return '~' + p.slice(home.length);
  }
  return p;
};

export const Welcome = ({ modelConfig, cwd }: Props) => {
  const dir = homePrefix(cwd ?? process.cwd());
  const dirName = path.basename(dir);
  const brand = themeColor('brand');
  const subtle = themeColor('subtle');
  const inactive = themeColor('inactive');
  const suggestion = themeColor('suggestion');

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Logo />
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={brand}
        paddingX={2}
        paddingY={0}
      >
        <Box>
          <Text color={brand} bold>
            {TEARDROP_ASTERISK}
          </Text>
          <Text>
            {' '}
            Welcome to <Text bold>coda</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={inactive}>
            {'  '}/help for commands · /model to switch model · @ to attach a file
          </Text>
        </Box>
        <Box>
          <Text color={inactive}>
            {'  '}cwd:{' '}
            <Text color={suggestion}>
              {dir}
              <Text color={subtle}> ({dirName})</Text>
            </Text>
          </Text>
        </Box>
        <Box>
          <Text color={inactive}>
            {'  '}model:{' '}
            <Text color={suggestion}>
              {modelConfig.name}
              <Text color={subtle}> · {modelConfig.effort}</Text>
            </Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
