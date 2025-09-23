import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { agent } from '../agent/graph.js';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { BaseMessage } from '@langchain/core/messages';

/** ---------- Types ---------- */
type Author = 'user' | 'agent' | 'system' | 'tool';
type ChunkKind = 'text' | 'code' | 'error' | 'list' | 'status' | 'divider' | 'tool-call' | 'tool-result';
type Mode = 'agent' | 'plan';

type Chunk = {
  kind: ChunkKind;
  text?: string;
  lines?: string[];
  tool?: string;
  toolInput?: Record<string, any>;
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

const HeaderBar = ({ title, mode }: { title: string; mode: Mode }) => {
  const [cwd, setCwd] = useState('');
  useEffect(() => {
    setCwd(process.cwd().replace(process.env.HOME || '', '~'));
  }, []);

  return (
    <Box flexDirection="column" alignSelf="flex-start">
      <Box marginBottom={1}>
        <Text color="cyan">
          {'                             ░██            \n'}
          {'                             ░██            \n'}
          {' ░███████   ░███████   ░████████  ░██████   \n'}
          {'░██    ░██ ░██    ░██ ░██    ░██       ░██  \n'}
          {'░██        ░██    ░██ ░██    ░██  ░███████  \n'}
          {'░██    ░██ ░██    ░██ ░██   ░███ ░██   ░██  \n'}
          {' ░███████   ░███████   ░█████░██  ░█████░██ \n'}
          {'                                            \n'}
          {'                                            \n'}
          {'                                            '}
        </Text>
      </Box>
      <Box
        borderStyle="single"
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Text>
            <Text bold color="cyan">model:</Text>
            <Text>     gpt-5   </Text>
            <Text dimColor>/model to change</Text>
          </Text>
        </Box>
        <Box>
          <Text>
            <Text bold color="cyan">mode:</Text>
            <Text>      {mode}   </Text>
            <Text dimColor>tab to switch</Text>
          </Text>
        </Box>
        <Box>
          <Text>
            <Text bold color="cyan">directory:</Text>
            <Text> {cwd}</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const Divider = () => (
  <Box marginY={0}>
    <Text color="gray">{'─'.repeat(80)}</Text>
  </Box>
);

const BubblePrefix = ({ author }: { author: Author }) => {
  if (author === 'user') return <Text color="cyan" bold>{'> '}</Text>;
  if (author === 'agent') return <Text color="green" bold>{'✦ '}</Text>;
  if (author === 'tool') return <Text color="#ffcc00" bold>{'⚡ '}</Text>;
  return <Text color="magenta" bold>{'• '}</Text>;
};

const CodeBlock = ({ lines }: { lines: string[] }) => (
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

const ErrorLine = ({ text }: { text: string }) => (
  <Text color="redBright">Error: {text}</Text>
);

const StatusLine = ({ text }: { text: string }) => (
  <Text>
    <Text dimColor>Generating... </Text>
    <Text>{text}</Text>
    <Text dimColor> ({nowTime()})</Text>
  </Text>
);

const ToolCall = ({ tool, input }: { tool: string; input: any }) => (
  <Box flexDirection="column" borderStyle="round" paddingX={1} borderColor="yellow" marginY={1}>
    <Text color="yellow" dimColor>Using tool: {tool}</Text>
    <Text color="gray">{JSON.stringify(input, null, 2)}</Text>
  </Box>
);

const ToolResult = ({ result }: { result: string }) => (
  <Box flexDirection="column" borderStyle="single" paddingX={1} borderColor="gray" marginY={1}>
    <Text dimColor>Tool Output:</Text>
    <Text color="gray">{result}</Text>
  </Box>
);

const MessageView = ({ msg }: { msg: Message }) => (
  <Box flexDirection="column" marginTop={1}>
    {msg.chunks.map((c, i) => {
      if (c.kind === 'divider') return <Divider key={i} />;
      if (c.kind === 'code') return <CodeBlock key={i} lines={c.lines ?? []} />;
      if (c.kind === 'error') return <ErrorLine key={i} text={c.text ?? ''} />;
      if (c.kind === 'status') return <StatusLine key={i} text={c.text ?? ''} />;
      if (c.kind === 'tool-call' && c.tool && c.toolInput) {
        return <ToolCall key={i} tool={c.tool} input={c.toolInput} />;
      }
      if (c.kind === 'tool-result') {
        return <ToolResult key={i} result={c.text ?? ''} />;
      }
      if (c.kind === 'list') {
        return <CodeBlock key={i} lines={c.lines ?? []} />;
      }
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

const Footer = ({ working, mode }: { working: boolean; mode: Mode }) => {
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
        <Text bold>{mode === 'agent' ? 'AGENT MODE' : 'PLAN MODE'}</Text>
      </Text>
    </Box>
  );
};

/** ---------- Main App ---------- */

export const App = () => {
  const { exit } = useApp();
  const [cols, rows] = useTerminalDimensions();

  const [mode, setMode] = useState<Mode>('agent');
  const [title, setTitle] = useState('AI-Powered Development Assistant');
  const [messages, setMessages] = useState<Message[]>([
    {
      author: 'system',
      chunks: [{ kind: 'text', text: 'Welcome to Coda! I can help you with your coding tasks. What should we work on?' }],
    },
  ]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const conversationHistory = useRef<BaseMessage[]>([]);

  useInput((input, key) => {
    if (key.escape) {
      if (busy) {
        // TODO: Implement agent interruption
        setBusy(false);
      } else {
        exit();
      }
    }
    if (key.tab) {
      setMode(prev => prev === 'agent' ? 'plan' : 'agent');
    }
  });

  const push = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || busy) return;

      const normalizedInput = value.trim().toLowerCase();
      if (normalizedInput === '/quit' || normalizedInput === '/exit') {
        push({ author: 'system', chunks: [{ kind: 'text', text: 'Goodbye!' }] });
        setTimeout(() => exit(), 100);
        return;
      }

      const userMessage = new HumanMessage(value);
      conversationHistory.current.push(userMessage);
      push({
        author: 'user',
        timestamp: nowTime(),
        chunks: [{ kind: 'text', text: value }],
      });
      setQuery('');
      setBusy(true);

      try {
        if (mode === 'plan') {
          // Plan mode: just show what the agent would do
          setTimeout(() => {
            push({
              author: 'agent',
              chunks: [{ kind: 'text', text: `[PLAN MODE] I would help you with: "${value}"` }],
            });
            setBusy(false);
          }, 600);
          return;
        }

        // Agent mode: use the real LangGraph agent
        const stream = await agent.stream({ messages: conversationHistory.current });
        for await (const chunk of stream) {
          const nodeName = Object.keys(chunk)[0];
          const update = chunk[nodeName as keyof typeof chunk];

          if (update && 'messages' in update && update.messages) {
            const newMessages: BaseMessage[] = update.messages;
            conversationHistory.current.push(...newMessages);

            for (const message of newMessages) {
              if (message._getType() === 'ai') {
                const aiMessage = message as AIMessage;
                if (aiMessage.content) {
                  push({
                    author: 'agent',
                    chunks: [{ kind: 'text', text: aiMessage.content as string }],
                  });
                }
                if (aiMessage.tool_calls) {
                  for (const toolCall of aiMessage.tool_calls) {
                    push({
                      author: 'agent',
                      chunks: [{
                        kind: 'tool-call',
                        tool: toolCall.name,
                        toolInput: toolCall.args,
                      }],
                    });
                  }
                }
              } else if (message._getType() === 'tool') {
                const toolMessage = message as ToolMessage;
                push({
                  author: 'tool',
                  chunks: [{
                    kind: 'tool-result',
                    text: toolMessage.content as string,
                  }],
                });
              }
            }
          }
        }
      } catch (error) {
        push({
          author: 'system',
          chunks: [{
            kind: 'error',
            text: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
          }],
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, push, mode, exit]
  );

  return (
    <Box flexDirection="column" width={cols} flexGrow={1}>
      <HeaderBar title={title} mode={mode} />

      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
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

      <Footer working={busy} mode={mode} />
    </Box>
  );
};