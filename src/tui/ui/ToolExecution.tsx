import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { Chunk } from '../../types/index.js';

const formatArgs = (args: Record<string, any>): string => {
  if (args.command) {
    return args.command;
  }
  if (args.path) {
    if (args.content) {
      return `${args.path}`; // Don't show content for write_file
    }
    return args.path;
  }
  return JSON.stringify(args);
};

export const ToolExecution = ({ chunk }: { chunk: Chunk }) => {
  const { status, toolName, toolArgs, output } = chunk;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === 'running') {
      const timer = setInterval(() => {
        setElapsed((prev) => prev + 0.1);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [status]);

  const commandString =
    toolName === 'execute_shell_command'
      ? toolArgs?.command ?? 'shell command'
      : `${toolName} ${formatArgs(toolArgs ?? {})}`;

  if (status === 'running') {
    return (
      <Box>
        <Box marginRight={1}>
          <Spinner type="dots" />
        </Box>
        <Text>
          Running <Text bold>{commandString}</Text>... ({elapsed.toFixed(1)}s)
        </Text>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="green">✔</Text> Ran <Text bold>{commandString}</Text>
        </Text>
        {output && !output.startsWith('Successfully') && (
          <Box borderStyle="round" paddingX={1} borderColor="gray" marginTop={1}>
            <Text dimColor>{output}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="red">✖</Text> Failed <Text bold>{commandString}</Text>
        </Text>
        {output && (
          <Box borderStyle="round" paddingX={1} borderColor="red" marginTop={1}>
            <Text color="redBright">{output}</Text>
          </Box>
        )}
      </Box>
    );
  }

  return null;
};