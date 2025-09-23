import React, { useCallback, useEffect, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
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
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


const useTerminalDimensions = (): [number, number] => {
  const { stdout } = useStdout();
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
        <Text> interrupt</Text>
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
  const { exit } = useApp();
  const [cols, rows] = useTerminalDimensions();

  const [title, setTitle] = useState('Implementing coin change in Python');
  const [messages, setMessages] = useState<Message[]>([
    {
      author: 'system',
      chunks: [{ kind: 'text', text: 'Welcome to Coda! How can I help you today?' }],
    },
  ]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  // Remove manual keyboard scrolling logic
  useInput((input, key) => {
    if (key.escape) exit();
  });

  const push = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const demoTranscript = useCallback(
    (originalPrompt: string) => {
      setTitle('Implementing coin change in Python');

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
    <Box flexDirection="column" width={cols} flexGrow={1}>
        <HeaderBar title={title} />

        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            {/* Render all messages and let the terminal handle scrolling */}
            {messages.map((message, index) => (
                <MessageView key={index} msg={message} />
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
