import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
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
      <Text dimColor>
        {working ? (blink ? 'working..' : 'working.') : ''}
        {working ? '   ' : ''}
        <Text dimColor>esc</Text> <Text> interrupt</Text>
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
  const [title, setTitle] = useState('Implementing coin change in Python');
  const [messages, setMessages] = useState<Message[]>([
    {
      author: 'system',
      chunks: [{kind: 'text', text: 'Welcome to Coda! How can I help you today?'}],
    },
  ]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<number>(0); // placeholder to keep React happy (Ink doesn’t scroll yet)

  useInput((input, key) => {
    if (key.escape) exit();
  });

  const push = useCallback((m: Message) => {
    setMessages(prev => [...prev, m]);
  }, []);

  const demoTranscript = useCallback((originalPrompt: string) => {
    // Header context
    setTitle('Implementing coin change in Python');

    // 1) user asks
    push({
      author: 'user',
      timestamp: nowTime(),
      chunks: [{kind: 'text', text: 'write a python implementation for coin change'}],
    });

    // 2) "Write coin_change.py" + code
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

    // 3) error message like in screenshot
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

    // 4) "List /Users/..." with directory listing
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

    // 5) Status line
    push({
      author: 'agent',
      chunks: [{kind: 'status', text: 'Build grok-code'}],
    });

    // 6) Prompt returns
    setBusy(false);
  }, [push]);

  const handleSubmit = useCallback(
    (value: string) => {
      if (!value.trim()) return;

      if (value.trim().toLowerCase() === '/quit' || value.trim().toLowerCase() === '/exit') {
        push({author: 'system', chunks: [{kind: 'text', text: 'Goodbye!'}]});
        setTimeout(() => exit(), 100);
        return;
      }

      setQuery('');
      setBusy(true);

      // For the demo we recreate the screenshot when the prompt mentions coin change or when "/demo"
      const normalized = value.trim().toLowerCase();
      const shouldDemo =
        normalized.includes('coin change') || normalized === '/demo';

      if (shouldDemo) {
        // simulate a tiny delay to let spinner show
        setTimeout(() => demoTranscript(value), 400);
        return;
      }

      // Fallback: simple echo conversation bubble
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

  // keep the cursor near bottom on updates (visual nicety)
  useEffect(() => {
    scrollRef.current++;
  }, [messages.length]);

  const leftPrompt = useMemo(
    () => (
      <Box>
        <Text color="cyan" bold>
          {'>'}{' '}
        </Text>
      </Box>
    ),
    []
  );

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <HeaderBar title={title} />
      {/* Conversation */}
      <Box flexDirection="column" marginTop={1}>
        {messages.map((m, i) => (
          <MessageView key={i} msg={m} />
        ))}
      </Box>

      {/* Loading indicator */}
      {busy && (
        <Box marginTop={1}>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> Coda is thinking...</Text>
        </Box>
      )}

      {/* Input */}
      {!busy && (
        <Box marginTop={1} alignItems="center">
          {leftPrompt}
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            placeholder=" Ask Coda anything..."
          />
        </Box>
      )}

      {/* Footer */}
      <Footer working={busy} />
    </Box>
  );
};
