import { Box, Text } from 'ink';
import { themeColor } from '@tui/theme.js';
import { BLACK_CIRCLE, ARROW_RIGHT_THIN } from '@tui/figures.js';
import { Spinner } from '../Spinner.js';
import { DiffView } from '../DiffView.js';
import { buildToolPatch, parseStructuredDiffOutput } from '@lib/structured-diff.js';
import type { Chunk } from '@types';

type Props = {
  chunk: Chunk;
};

const HOME = process.env.HOME ?? '';

const tildify = (p: string): string => {
  if (HOME && p.startsWith(HOME)) return '~' + p.slice(HOME.length);
  return p;
};

const formatPath = (p: string): string => {
  if (!p) return '';
  if (p.startsWith('/') || p.startsWith('~')) return tildify(p);
  return p;
};

type ToolHeading = {
  verb: string;
  target: string;
  details?: string;
};

function describeTool(toolName: string | undefined, args: Record<string, any>): ToolHeading {
  const name = toolName ?? 'tool';
  if (name === 'execute_shell_command' || name === 'execute' || name === 'shell' || name === 'bash') {
    const cmd = String(args.command ?? args.cmd ?? '').trim();
    return { verb: 'Bash', target: cmd || name };
  }
  if (name === 'read_file' || name === 'read') {
    return { verb: 'Read', target: formatPath(String(args.path ?? args.file_path ?? '')) };
  }
  if (name === 'write_file' || name === 'write') {
    return { verb: 'Write', target: formatPath(String(args.path ?? args.file_path ?? '')) };
  }
  if (name === 'edit_file' || name === 'apply_diff' || name === 'edit') {
    return { verb: 'Edit', target: formatPath(String(args.path ?? args.file_path ?? '')) };
  }
  if (name === 'list_files' || name === 'ls') {
    return { verb: 'List', target: formatPath(String(args.path ?? args.directory ?? '.')) };
  }
  if (name === 'grep' || name === 'search') {
    const pat = String(args.pattern ?? args.query ?? '');
    const where = formatPath(String(args.path ?? '.'));
    return { verb: 'Grep', target: pat, details: where };
  }
  if (name === 'glob') {
    return { verb: 'Glob', target: String(args.pattern ?? '') };
  }
  if (name === 'todo_write' || name === 'todowrite' || name === 'write_todos') {
    return { verb: 'Plan', target: 'update todos' };
  }
  if (name === 'task') {
    return { verb: 'Subagent', target: String(args.description ?? args.subagent_type ?? 'task') };
  }
  // Generic fallback
  const compact = Object.entries(args)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' ');
  return { verb: name, target: compact };
}

const Output = ({ output, color }: { output: string; color?: string }) => {
  const inactive = themeColor('inactive');
  const lines = output.split('\n');
  const MAX = 12;
  const shown = lines.slice(0, MAX);
  const overflow = lines.length - shown.length;
  return (
    <Box flexDirection="column" paddingLeft={3}>
      {shown.map((line, idx) => (
        <Box key={idx}>
          <Text color={inactive}>{ARROW_RIGHT_THIN} </Text>
          <Text color={color ?? inactive}>{line}</Text>
        </Box>
      ))}
      {overflow > 0 ? (
        <Box>
          <Text color={inactive}>  …{overflow} more lines</Text>
        </Box>
      ) : null}
    </Box>
  );
};

export const ToolUseMessage = ({ chunk }: Props) => {
  const { status, toolName, toolArgs, output } = chunk;
  const args = toolArgs ?? {};
  const heading = describeTool(toolName, args);

  const brand = themeColor('brand');
  const subtle = themeColor('subtle');
  const inactive = themeColor('inactive');
  const success = themeColor('success');
  const error = themeColor('error');

  const dotColor = status === 'error' ? error : status === 'success' ? brand : brand;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row">
        <Box minWidth={2}>
          <Text color={dotColor} bold>
            {BLACK_CIRCLE}
          </Text>
        </Box>
        <Box flexGrow={1}>
          <Text>
            <Text bold>{heading.verb}</Text>
            {heading.target ? (
              <>
                <Text color={subtle}>(</Text>
                <Text>{heading.target}</Text>
                <Text color={subtle}>)</Text>
              </>
            ) : null}
            {heading.details ? <Text color={inactive}> {heading.details}</Text> : null}
            {status === 'running' ? (
              <Text color={inactive}>
                {' '}
                <Spinner /> running…
              </Text>
            ) : null}
            {status === 'success' ? <Text color={success}> ✓</Text> : null}
            {status === 'error' ? <Text color={error}> ✗</Text> : null}
          </Text>
        </Box>
      </Box>

      {status === 'success' ? (() => {
        const toolPatch = buildToolPatch(toolName, args);
        if (toolPatch && toolPatch.hunks.length > 0) {
          return <DiffView hunks={toolPatch.hunks} filePath={toolPatch.filePath} />;
        }

        if (!output) return null;

        const hunks = parseStructuredDiffOutput(output);
        if (hunks) {
          return <DiffView hunks={hunks} />;
        }
        // For Read, just show the line count summary
        if (heading.verb === 'Read') {
          const lineCount = output.split('\n').length;
          return (
            <Box paddingLeft={3}>
              <Text color={inactive}>{ARROW_RIGHT_THIN} {lineCount} lines</Text>
            </Box>
          );
        }
        // Skip noisy "Successfully…" outputs
        if (output.startsWith('Successfully')) return null;
        return <Output output={output} />;
      })() : null}

      {status === 'error' && output ? <Output output={output} color={error} /> : null}
    </Box>
  );
};
