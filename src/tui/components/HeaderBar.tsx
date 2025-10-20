import { Box, Text } from 'ink';
import { Logo } from './Logo.js';
import type { HeaderBarProps } from '@types';
import { useStore } from '@app/store.js';

export const HeaderBar = ({ mode, modelConfig }: HeaderBarProps) => {
  const cwd = process.cwd().replace(process.env.HOME || '', '~');
  const contextCount = useStore(s => s.contextPaths.length);
  return (
    <Box flexDirection="column" alignSelf="flex-start">
      <Box marginBottom={1}>
        <Logo />
      </Box>
      <Box
        borderStyle="single"
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Text>
            <Text bold color="cyan">model:</Text>
            <Text> {modelConfig.name} {modelConfig.effort} </Text>
            <Text dimColor>/model to change</Text>
          </Text>
        </Box>
        <Box>
          <Text>
            <Text bold color="cyan">mode:</Text>
            <Text> {mode} </Text>
            <Text dimColor>tab to switch</Text>
          </Text>
        </Box>
        <Box>
          <Text>
            <Text bold color="cyan">directory:</Text>
            <Text> {cwd}</Text>
          </Text>
        </Box>
        <Box>
          <Text>
            <Text bold color="cyan">context:</Text>
            <Text> {contextCount} item(s) </Text>
            <Text dimColor># to view</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

