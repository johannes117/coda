import { useCallback, useMemo, useState, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { createAgent } from '../agent/graph.js';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { BaseMessage } from '@langchain/core/messages';
import { storeApiKey, deleteStoredApiKey, saveSession } from '../utils/storage.js';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { logError } from '../utils/logger.js';
import type { Mode, ModelConfig, Message } from '../types/index.js';
import { modelOptions, nowTime } from '../utils/helpers.js';
import { useStore } from '../store/index.js';
import { HeaderBar } from './ui/HeaderBar.js';
import { MessageView } from './ui/MessageView.js';
import { Footer } from './ui/Footer.js';

export const App = () => {
  const { exit } = useApp();
  const cols = useStore((s) => s.terminalCols);
  const apiKey = useStore((s) => s.apiKey);
  const showApiKeyPrompt = !apiKey;
  const currentModel = useStore((s) => s.modelConfig);
  const messages = useStore((s) => s.messages);
  const busy = useStore((s) => s.busy);
  const setBusy = useStore((s) => s.setBusy);
  const addMessage = useStore((s) => s.addMessage);
  const resetMessages = useStore((s) => s.resetMessages);
  const setApiKeyStore = useStore((s) => s.setApiKey);
  const setModelConfig = useStore((s) => s.setModelConfig);
  const clearApiKeyStore = useStore((s) => s.clearApiKey);
  const [mode, setMode] = useState<Mode>('agent');
  const [query, setQuery] = useState('');
  const [showModelPrompt, setShowModelPrompt] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const agentInstance = useMemo(
    () => (apiKey ? createAgent(apiKey, currentModel) : null),
    [apiKey, currentModel]
  );
  const [sessionId] = useState(() => randomUUID());
  const conversationHistory = useRef<BaseMessage[]>([]);
  const currentOption = modelOptions.find((o) => o.name === currentModel.name && o.effort === currentModel.effort);
  const currentId = currentOption ? currentOption.id : 5;

  const push = useCallback((message: Message) => {
    addMessage(message);
  }, [addMessage]);

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
          clearApiKeyStore();
          resetMessages();
          conversationHistory.current = [];
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
          resetMessages();
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
          setTimeout(() => {
            push({
              author: 'agent',
              chunks: [{ kind: 'text', text: `[PLAN MODE] I would help you with: "${value}"` }],
            });
            setBusy(false);
          }, 600);
          return;
        }

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
    [busy, push, mode, exit, agentInstance, currentModel, sessionId, resetMessages, clearApiKeyStore]
  );

  const handleApiKeySubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      await storeApiKey(trimmed);
      setApiKeyStore(trimmed);
      setApiKeyInput('');
    },
    [setApiKeyStore]
  );

  const handleModelSubmit = useCallback(
    (value: string) => {
      const num = parseInt(value.trim(), 10);
      if (num >= 1 && num <= 6 && apiKey) {
        const option = modelOptions[num - 1];
        const newConfig: ModelConfig = { name: option.name, effort: option.effort };
        setModelConfig(newConfig);
        setShowModelPrompt(false);
        push({
          author: 'system',
          chunks: [{ kind: 'text', text: `Model switched to ${option.label}` }],
        });
      }
      setModelInput('');
    },
    [apiKey, push, setModelConfig]
  );

  if (showApiKeyPrompt) {
    return (
      <Box flexDirection="column" width={cols} flexGrow={1} justifyContent="center" alignItems="center" paddingY={2}>
        <HeaderBar title="Setup" mode={mode} modelConfig={currentModel} />
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text bold color="cyan">Welcome to coda!</Text>
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
            <Text dimColor>Switch between Openrouter models for this and future coda sessions</Text>
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
      <HeaderBar title="AI-Powered Development Assistant" mode={mode} modelConfig={currentModel} />
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {messages.map((message, index) => (
          <MessageView key={index} msg={message} />
        ))}
        {busy && (
          <Box marginTop={1}>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text> coda is thinking...</Text>
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
            placeholder=" Ask coda anything..."
          />
        </Box>
      )}
      <Footer working={busy} mode={mode} />
    </Box>
  );
};