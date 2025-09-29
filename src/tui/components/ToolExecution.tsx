import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { ToolExecutionProps } from '@types';
import { DiffView } from './DiffView.js';

const formatArgs = (args: Record<string, any>): string => {
  if (args.command) {
    return args.command;
  }
  if (args.path) {
    if (args.content || args.diff) {
      return `${args.path}`; // Don't show content/diff for write_file/apply_diff
    }
    return args.path;
  }
  return JSON.stringify(args);
};

export const ToolExecution = ({ chunk }: ToolExecutionProps) => {
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
    if (toolName === 'read_file') {
      const lineCount = output?.split('\n').length ?? 0;
      return (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✔</Text> Read <Text bold>{commandString}</Text>
          </Text>
          <Box marginLeft={2}>
            <Text dimColor>Read {lineCount} lines</Text>
          </Box>
        </Box>
      );
    }
    if (toolName === 'write_file' || toolName === 'apply_diff') {
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(output ?? '{}');
      } catch (e) {
        return <Text color="yellow">✔ Wrote to {commandString}</Text>;
      }
      const diffLines = Array.isArray(parsedOutput.diffLines) ? parsedOutput.diffLines : undefined;
      return (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✔</Text> Update <Text bold>{commandString}</Text>
          </Text>
          <Box marginLeft={2}>
            <Text dimColor>{parsedOutput.summary ?? 'File updated.'}</Text>
          </Box>
          {diffLines && <DiffView diffLines={diffLines} />}
        </Box>
      );
    }
    const showOutput =
      output && !output.startsWith('Successfully') && toolName !== 'list_files' && toolName !== 'execute_shell_command';
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="green">✔</Text> Ran <Text bold>{commandString}</Text>
        </Text>
        {showOutput && (
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

