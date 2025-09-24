import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { createAgent } from '../agent/graph.js';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { BaseMessage } from '@langchain/core/messages';
import { getStoredApiKey, storeApiKey, deleteStoredApiKey, saveSession, loadSession } from '../utils/storage.js';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { Logo } from './Logo.js';
import { logError } from '../utils/logger.js';
/** ---------- Types ---------- */
type Author = 'user' | 'agent' | 'system' | 'tool';
type ChunkKind = 'text' | 'code' | 'error' | 'list' | 'status' | 'divider' | 'tool-call' | 'tool-result';
type Mode = 'agent' | 'plan';
type ModelOption = { id: number; label: string; name: string; effort: string };
type ModelConfig = { name: string; effort: string };
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
const modelOptions: ModelOption[] = [
  { id: 1, label: 'grok-code-fast-1', name: 'x-ai/grok-code-fast-1', effort: 'medium' },
  { id: 2, label: 'claude-sonnet-4', name: 'anthropic/claude-sonnet-4', effort: 'medium' },
  { id: 3, label: 'grok-4-fast:free', name: 'x-ai/grok-4-fast:free', effort: 'medium' },
  { id: 4, label: 'gpt-5-low', name: 'openai/gpt-5', effort: 'low' },
  { id: 5, label: 'gpt-5-medium', name: 'openai/gpt-5', effort: 'medium' },
  { id: 6, label: 'gpt-5-high', name: 'openai/gpt-5', effort: 'high' },
];
/** ---------- Presentational bits ---------- */
const HeaderBar = ({ title, mode, modelConfig }: { title: string; mode: Mode; modelConfig: ModelConfig }) => {
  const [cwd, setCwd] = useState('');
  useEffect(() => {
    setCwd(process.cwd().replace(process.env.HOME || '', '~'));
  }, []);
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
        {working ? <Text dimColor>{' '}</Text> : null}
        <Text dimColor>esc</Text>
        <Text> interrupt</Text>
      </Text>
      <Text dimColor>
        coda v0.1.0 ~
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
  const [cols] = useTerminalDimensions();
  const [mode, setMode] = useState<Mode>('agent');
  const [title, setTitle] = useState('AI-Powered Development Assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(true);
  const [showModelPrompt, setShowModelPrompt] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [agentInstance, setAgentInstance] = useState<any>(null);
  const [currentModel, setCurrentModel] = useState<ModelConfig>({ name: 'openai/gpt-5', effort: 'medium' });
  const [sessionId] = useState(() => randomUUID());
  const conversationHistory = useRef<BaseMessage[]>([]);
  const currentOption = modelOptions.find(o => o.name === currentModel.name && o.effort === currentModel.effort);
  const currentId = currentOption ? currentOption.id : 5;

  const push = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const key = await getStoredApiKey();
      if (key) {
        setApiKeyState(key);
        setShowApiKeyPrompt(false);
        setAgentInstance(createAgent(key, currentModel));

        conversationHistory.current = [];
        setMessages([
          {
            author: 'system',
            chunks: [{ kind: 'text', text: 'Welcome to Coda! I can help you with your coding tasks. What should we work on?' }],
          },
        ]);
      } else {
        setShowApiKeyPrompt(true);
      }
    };
    loadData();
  }, [currentModel]);

  const handleApiKeySubmit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setApiKeyState(trimmed);
    storeApiKey(trimmed);
    setShowApiKeyPrompt(false);
    setMessages([
      {
        author: 'system',
        chunks: [{ kind: 'text', text: 'Welcome to Coda! I can help you with your coding tasks. What should we work on?' }],
      },
    ]);
    setAgentInstance(createAgent(trimmed, currentModel));
    setApiKeyInput('');
  }, [currentModel]);

  const handleModelSubmit = useCallback((value: string) => {
    const num = parseInt(value.trim(), 10);
    if (num >= 1 && num <= 6 && apiKey) {
      const option = modelOptions[num - 1];
      const newConfig: ModelConfig = { name: option.name, effort: option.effort };
      setCurrentModel(newConfig);
      setAgentInstance(createAgent(apiKey, newConfig));
      setShowModelPrompt(false);
      push({
        author: 'system',
        chunks: [{ kind: 'text', text: `Model switched to ${option.label}` }],
      });
    }
    setModelInput('');
  }, [apiKey, push]);

  useInput((input, key) => {
    if (key.escape) {
      if (busy) {
        setBusy(false);
      } else if (showModelPrompt) {
        setShowModelPrompt(false);
      } else {
        exit();
      }
      return;
    }
    if (key.tab && !showApiKeyPrompt && !showModelPrompt) {
      setMode(prev => prev === 'agent' ? 'plan' : 'agent');
    }
  });

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || busy || !agentInstance) return;
      const command = value.trim().toLowerCase();
      if (command.startsWith('/')) {
        const cmd = command.slice(1);
        if (cmd === 'quit' || cmd === 'exit') {
          push({ author: 'system', chunks: [{ kind: 'text', text: 'Goodbye!' }] });
          setTimeout(() => exit(), 100);
          return;
        } else if (cmd === 'reset') {
          await deleteStoredApiKey();
          setApiKeyState(null);
          setShowApiKeyPrompt(true);
          setMessages([]);
          setAgentInstance(null);
          setQuery('');
          return;
        } else if (cmd === 'status') {
          const cwd = process.cwd().replace(process.env.HOME || '', '~');
          const agentsFile = existsSync('AGENTS.md') ? 'AGENTS.md' : 'none';
          const statusText = `📂 Workspace
  • Path: ${cwd}
  • Approval Mode: auto
  • Sandbox: full
  • AGENTS files: ${agentsFile}
👤 Account
  • Signed in with Openrouter API
  • Login: N/A
  • Plan: API
🧠 Model
  • Name: ${currentModel.name}
  • Provider: Openrouter
  • Reasoning Effort: ${currentModel.effort}
  • Reasoning Summaries: Auto
💻 Client
  • CLI Version: 0.1.0
📊 Token Usage
  • Session ID: ${sessionId}
  • Input: 0
  • Output: 0
  • Total: 0`;
          push({ author: 'system', chunks: [{ kind: 'text', text: statusText }] });
          setQuery('');
          return;
        } else if (cmd === 'clear' || cmd === 'new') {
          setMessages([
            {
              author: 'system',
              chunks: [{ kind: 'text', text: 'Welcome to Coda! I can help you with your coding tasks. What should we work on?' }],
            },
          ]);
          conversationHistory.current = [];
          push({ author: 'system', chunks: [{ kind: 'text', text: 'New conversation started.' }] });
          setQuery('');
          return;
        } else if (cmd === 'model') {
          setShowModelPrompt(true);
          setQuery('');
          return;
        } else {
          push({
            author: 'system',
            chunks: [{ kind: 'error', text: `Unknown command: ${command}. Available: /status, /model, /reset, /clear, /new, /quit` }],
          });
          setQuery('');
          return;
        }
      }
      const userMessage = new HumanMessage(value);
      conversationHistory.current.push(userMessage);
      push({
        author: 'user',
        timestamp: nowTime(),
        chunks: [{ kind: 'text', text: value }],
      });
      setQuery('');

      await saveSession('last_session', conversationHistory.current);
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
        const stream = await agentInstance.stream({ messages: conversationHistory.current });
        for await (const chunk of stream) {
          const nodeName = Object.keys(chunk)[0];
          const update = chunk[nodeName as keyof typeof chunk];
          if (update && 'messages' in update && update.messages) {
            const newMessages: BaseMessage[] = update.messages;
            conversationHistory.current.push(...newMessages);
            await saveSession('last_session', conversationHistory.current);
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
        const errorMsg = `An error occurred: ${error instanceof Error ? error.message : String(error)}`;
        await logError(errorMsg);
        push({
          author: 'system',
          chunks: [{ kind: 'error', text: errorMsg }],
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, push, mode, exit, agentInstance, apiKey, currentModel, sessionId]
  );
  if (showApiKeyPrompt) {
    return (
      <Box flexDirection="column" width={cols} flexGrow={1} justifyContent="center" alignItems="center" paddingY={2}>
        <HeaderBar title="Setup" mode={mode} modelConfig={currentModel} />
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text bold color="cyan">Welcome to Coda!</Text>
          <Box marginTop={1}>
            <Text dimColor>Enter your Openrouter API key to get started:</Text>
          </Box>
          <Box marginTop={1} width="80%">
            <TextInput
              value={apiKeyInput}
              onChange={setApiKeyInput}
              onSubmit={handleApiKeySubmit}
              placeholder="sk-..."
              showCursor
              mask="•"
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press esc to quit.</Text>
          </Box>
        </Box>
      </Box>
    );
  }
  if (showModelPrompt) {
    return (
      <Box flexDirection="column" width={cols} flexGrow={1} justifyContent="center" alignItems="center" paddingY={2}>
        <HeaderBar title="Select Model" mode={mode} modelConfig={currentModel} />
        <Box marginTop={2} flexDirection="column" width="80%">
          <Text bold color="cyan">Select model and reasoning level</Text>
          <Box marginTop={1}>
            <Text dimColor>Switch between Openrouter models for this and future Coda sessions</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            {modelOptions.map((opt) => (
              <Text key={opt.id}>
                {opt.id === currentId ? <Text color="cyan">▌&gt; </Text> : <Text>▌ </Text>}
                {opt.id}. {opt.label}
                {opt.id === currentId ? <Text color="yellow">(current)</Text> : null}
              </Text>
            ))}
          </Box>
          <Box marginTop={1}>
            <TextInput
              value={modelInput}
              onChange={setModelInput}
              onSubmit={handleModelSubmit}
              placeholder="Enter number (1-6)"
              showCursor
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press esc to cancel.</Text>
          </Box>
        </Box>
      </Box>
    );
  }
  return (
    <Box flexDirection="column" width={cols} flexGrow={1}>
      <HeaderBar title={title} mode={mode} modelConfig={currentModel} />
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
      {!busy && !showModelPrompt && (
        <Box marginTop={1} alignItems="center">
          <Text color="cyan" bold>&gt; </Text>
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