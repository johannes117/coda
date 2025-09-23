import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Box, Text, useApp, useInput, useStdout} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

/** ---------- Types ---------- */
type Author = 'user' | 'agent' | 'system';
type ChunkKind = 'text' | 'code' | 'error' | 'list' | 'status' | 'divider';

type Chunk = {
  kind: ChunkKind;
  text?: string;
  lines?: string[];
};

type Message = {
  author: Author;
  timestamp?: string;
  chunks: Chunk[];
};

/** ---------- Utilities ---------- */
const nowTime = () =>
  new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

// Approximate terminal height consumption for each chunk type.
const chunkHeight = (c: Chunk): number => {
  switch (c.kind) {
    case 'code':
    case 'list':
      return (c.lines?.length ?? 0) + 2; // bordered block adds two lines
    case 'divider':
      return 1;
    case 'error':
    case 'status':
    case 'text':
    default:
      return 1;
  }
};

const messageHeight = (m: Message): number =>
  m.chunks.reduce((sum, chunk) => sum + chunkHeight(chunk), 0);

type ViewportSlice = {
  visible: Message[];
  totalLines: number;
  maxScroll: number;
};

const sliceForViewport = (items: Message[], viewportLines: number, scroll: number): ViewportSlice => {
  const heights = items.map(messageHeight);
  const totalLines = heights.reduce((acc, value) => acc + value, 0);
  const effectiveViewport = Math.max(0, viewportLines);
  const maxScroll = Math.max(0, totalLines - effectiveViewport);
  const clampedScroll = Math.max(0, Math.min(scroll, maxScroll));
  const windowStart = Math.max(0, totalLines - effectiveViewport - clampedScroll);
  const windowEnd = windowStart + effectiveViewport;

  const visible: Message[] = [];
  let cumulative = 0;

  for (let i = 0; i < items.length; i++) {
    const next = cumulative + heights[i];
    const overlaps = next > windowStart && cumulative < windowEnd;
    if (overlaps) visible.push(items[i]);
    cumulative = next;
  }

  return {visible, totalLines, maxScroll};
};

const useTerminalDimensions = (): [number, number] => {
  const {stdout} = useStdout();
  const [size, setSize] = useState<[number, number]>([stdout?.columns ?? 80, stdout?.rows ?? 24]);

  useEffect(() => {
    if (!stdout) return;

    const updateSize = () => {
      setSize([stdout.columns ?? 80, stdout.rows ?? 24]);
    };

    updateSize();
    stdout.on('resize', updateSize);

    return () => {
      stdout.removeListener('resize', updateSize);
    };
  }, [stdout]);

  return size;
};

const useBlink = () => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn(v => !v), 600);
    return () => clearInterval(id);
  }, []);
  return on;
};

/** ---------- Presentational bits ---------- */

const HeaderBar = ({title}: {title: string}) => {
  return (
    <Box
      borderStyle="single"
      paddingX={1}
      justifyContent="space-between"
      width="100%"
    >
      <Text>
        <Text color="gray"># </Text>
        <Text bold>{title}</Text>
      </Text>
      <Text dimColor>share to create a shareable link</Text>
    </Box>
  );
};

const Divider = () => (
  <Box marginY={0}>
    <Text color="gray">{'─'.repeat(80)}</Text>
  </Box>
);

const BubblePrefix = ({author}: {author: Author}) => {
  if (author === 'user') return <Text color="cyan" bold>{'> '}</Text>;
  if (author === 'agent') return <Text color="green" bold>{'✦ '}</Text>;
  return <Text color="magenta" bold>{'• '}</Text>;
};

const CodeBlock = ({lines}: {lines: string[]}) => (
  <Box
    flexDirection="column"
    borderStyle="round"
    paddingX={1}
    paddingY={0}
    marginTop={1}
    marginBottom={1}
  >
    {lines.map((l, i) => (
      <Text key={i} color="gray">
        {l}
      </Text>
    ))}
  </Box>
);

const ErrorLine = ({text}: {text: string}) => (
  <Text color="redBright">Error: {text}</Text>
);

const StatusLine = ({text}: {text: string}) => (
  <Text>
    <Text dimColor>Generating... </Text>
    <Text>{text}</Text>
    <Text dimColor> ({nowTime()})</Text>
  </Text>
);

const MessageView = ({msg}: {msg: Message}) => (
  <Box flexDirection="column" marginTop={1}>
    {/* Optional title line inside a message chunk (first chunk “text” often used as a header) */}
    {msg.chunks.map((c, i) => {
      if (c.kind === 'divider') return <Divider key={i} />;
      if (c.kind === 'code') return <CodeBlock key={i} lines={c.lines ?? []} />;
      if (c.kind === 'error') return <ErrorLine key={i} text={c.text ?? ''} />;
      if (c.kind === 'status') return <StatusLine key={i} text={c.text ?? ''} />;
      if (c.kind === 'list')
        return (
          <CodeBlock
            key={i}
            lines={c.lines ?? []}
          />
        );
      // 'text'
      return (
        <Box key={i} flexDirection="row">
          <BubblePrefix author={msg.author} />
          <Text>{c.text}</Text>
          {msg.timestamp ? (
            <Text dimColor> ({msg.timestamp})</Text>
          ) : null}
        </Box>
      );
    })}
  </Box>
);

const Footer = ({working}: {working: boolean}) => {
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
        {working ? <Text dimColor>{'   '}</Text> : null}
        <Text dimColor>esc</Text>
        <Text> interrupt  ·  </Text>
        <Text dimColor>↑/↓ PgUp/PgDn Home/End</Text>
        <Text> scroll</Text>
      </Text>
      <Text dimColor>
        coda v0.1.0  ~
      </Text>
      <Text>
        <Text dimColor>tab | </Text>
        <Text bold>BUILD AGENT</Text>
      </Text>
    </Box>
  );
};

/** ---------- Main App ---------- */

export const App = () => {
  const {exit} = useApp();
  const [cols, rows] = useTerminalDimensions();

  const [title, setTitle] = useState('Implementing coin change in Python');
  const [messages, setMessages] = useState<Message[]>([
    {
      author: 'system',
      chunks: [{kind: 'text', text: 'Welcome to Coda! How can I help you today?'}],
    },
  ]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [scroll, setScroll] = useState(0);

  const reservedBottom = 1 /* input */ + 1 /* footer */ + 1 /* spinner */ + 1 /* margin */;
  const reservedTop = 3;
  const viewportLines = Math.max(3, rows - reservedTop - reservedBottom);

  const {visible: visibleMessages, maxScroll} = useMemo(
    () => sliceForViewport(messages, viewportLines, scroll),
    [messages, viewportLines, scroll]
  );

  useEffect(() => {
    setScroll(prev => (prev === 0 ? 0 : Math.min(prev, maxScroll)));
  }, [messages, maxScroll]);

  useInput(
    (input, key) => {
      if (key.escape) exit();

      if (key.upArrow) setScroll(prev => Math.min(maxScroll, prev + 1));
      if (key.downArrow) setScroll(prev => Math.max(0, prev - 1));
      if (key.pageUp) setScroll(prev => Math.min(maxScroll, prev + viewportLines));
      if (key.pageDown) setScroll(prev => Math.max(0, prev - viewportLines));

      const isHomeKey = input === '\u001b[H' || input === '\u001b[1~';
      const isEndKey = input === '\u001b[F' || input === '\u001b[4~';

      if (isHomeKey) setScroll(maxScroll);
      if (isEndKey) setScroll(0);
    });

  const push = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const demoTranscript = useCallback(
    (originalPrompt: string) => {
      setTitle('Implementing coin change in Python');
      setScroll(0);

      push({
        author: 'user',
        timestamp: nowTime(),
        chunks: [{kind: 'text', text: 'write a python implementation for coin change'}],
      });

      push({
        author: 'agent',
        chunks: [{kind: 'text', text: 'Write coin_change.py'}],
      });

      push({
        author: 'agent',
        chunks: [
          {
            kind: 'code',
            lines: [
              'def coin_change(coins, amount):',
              '    if amount == 0:',
              "        return 0",
              "    dp = [float('inf')] * (amount + 1)",
              '    dp[0] = 0',
              '    for coin in coins:',
              '        for i in range(coin, amount + 1):',
              '            dp[i] = min(dp[i], dp[i - coin] + 1)',
              "    return dp[amount] if dp[amount] != float('inf') else -1",
            ],
          },
        ],
      });

      push({
        author: 'agent',
        chunks: [
          {
            kind: 'error',
            text:
              'You must read the file /Users/johannes.duplessis/coin_change.py before overwriting it. Use the Read tool first',
          },
        ],
      });

      push({
        author: 'agent',
        chunks: [
          {kind: 'text', text: 'List /Users/johannes.duplessis'},
          {
            kind: 'list',
            lines: [
              '',
              '/Users/johannes.duplessis/',
              '  .azure/',
              '  bin/',
              '  bicep',
              '  logs/',
              '    telemetry.log',
              '  az.json',
              '  az.sess',
              '  az_survey.json',
              '  azureProfile.json',
              '',
            ],
          },
        ],
      });

      push({
        author: 'agent',
        chunks: [{kind: 'status', text: 'Build grok-code'}],
      });

      setBusy(false);
    },
    [push]
  );

  const handleSubmit = useCallback(
    (value: string) => {
      if (!value.trim()) return;

      const normalizedInput = value.trim().toLowerCase();
      if (normalizedInput === '/quit' || normalizedInput === '/exit') {
        push({author: 'system', chunks: [{kind: 'text', text: 'Goodbye!'}]});
        setTimeout(() => exit(), 100);
        return;
      }

      setQuery('');
      setBusy(true);
      setScroll(0);

      const shouldDemo = normalizedInput.includes('coin change') || normalizedInput === '/demo';
      if (shouldDemo) {
        setTimeout(() => demoTranscript(value), 400);
        return;
      }

      push({
        author: 'user',
        timestamp: nowTime(),
        chunks: [{kind: 'text', text: value}],
      });

      setTimeout(() => {
        push({
          author: 'agent',
          chunks: [{kind: 'text', text: `This is a dummy response to: "${value}"`}],
        });
        setBusy(false);
      }, 600);
    },
    [demoTranscript, exit, push]
  );

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} height={rows} width={cols}>
      <HeaderBar title={title} />

      <Box flexDirection="column" marginTop={1} flexGrow={1}>
        {visibleMessages.map((message, index) => (
          <MessageView key={`${messages.indexOf(message)}-${index}`} msg={message} />
        ))}

        {busy && (
          <Box marginTop={1}>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text> Coda is thinking...</Text>
          </Box>
        )}
      </Box>

      {!busy && (
        <Box marginTop={1} alignItems="center">
          <Text color="cyan" bold>{'>'} </Text>
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            placeholder=" Ask Coda anything..."
          />
        </Box>
      )}

      <Footer working={busy} />
    </Box>
  );
};
