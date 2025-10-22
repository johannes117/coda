import { useEffect, useMemo, useState } from 'react';
import type { Message, Mode, ModelConfig, TokenUsage, ToolExecution } from '@types';
import { modelOptions } from '../lib/models.js';
import { createWelcomeMessage } from '../lib/messages.js';
import { generateId } from '../lib/id.js';
import type { AgentEvent } from '../ipc/events.js';

const DEFAULT_TOKEN_USAGE: TokenUsage = { input: 0, output: 0, total: 0 };

const applyToolExecutionUpdate = (messages: Message[], toolExec: ToolExecution): Message[] =>
  messages.map((message) => ({
    ...message,
    chunks: message.chunks.map((chunk) => {
      if (chunk.kind === 'tool-execution' && chunk.toolCallId === toolExec.toolCallId) {
        return { ...chunk, status: toolExec.status, output: toolExec.output };
      }
      return chunk;
    }),
  }));

const buildSystemMessage = (text: string, kind: 'text' | 'error' = 'text'): Message => ({
  id: generateId(),
  author: 'system',
  chunks: [{ kind, text }],
});

const renderChunk = (chunk: Message['chunks'][number], index: number) => {
  switch (chunk.kind) {
    case 'code':
      return (
        <pre key={`code-${index}`} style={styles.codeBlock}>
          <code>{chunk.lines?.join('\n') ?? chunk.text}</code>
        </pre>
      );
    case 'error':
      return (
        <p key={`error-${index}`} style={styles.errorText}>
          {chunk.text}
        </p>
      );
    case 'tool-execution':
      return (
        <div key={chunk.toolCallId ?? `tool-${index}`} style={styles.toolExecution}>
          <div style={styles.toolExecutionHeader}>
            <span style={styles.toolExecutionName}>{chunk.toolName}</span>
            <span style={styles.toolExecutionStatus(chunk.status ?? 'running')}>
              {chunk.status ?? 'running'}
            </span>
          </div>
          {chunk.output && <pre style={styles.toolExecutionOutput}>{chunk.output}</pre>}
        </div>
      );
    default:
      return (
        <p key={`text-${index}`} style={styles.messageParagraph}>
          {chunk.text ?? (chunk.lines ?? []).join('\n')}
        </p>
      );
  }
};

export const App = () => {
  const [initialized, setInitialized] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    name: 'anthropic/claude-sonnet-4.5',
    effort: 'medium',
  });
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<Mode>('agent');
  const [busy, setBusy] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>(DEFAULT_TOKEN_USAGE);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const state = await window.coda.getInitialState();
        setApiKey(state.apiKey);
        setModelConfig(state.modelConfig);
        setMessages(state.messages);
        setTokenUsage(state.tokenUsage);
      } catch (error) {
        setStatusMessage(`Failed to load initial state: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setInitialized(true);
      }
    };

    const unsubscribe = window.coda.onAgentEvent((event: AgentEvent) => {
      switch (event.type) {
        case 'busy':
          setBusy(event.payload);
          break;
        case 'message':
          setMessages((prev) => [...prev, event.payload]);
          break;
        case 'tokenUsage':
          setTokenUsage(event.payload);
          break;
        case 'toolExecution':
          setMessages((prev) => applyToolExecutionUpdate(prev, event.payload));
          break;
        case 'error':
          setMessages((prev) => [...prev, buildSystemMessage(event.payload, 'error')]);
          setStatusMessage(event.payload);
          setBusy(false);
          break;
        case 'reset':
          setMessages([createWelcomeMessage()]);
          setTokenUsage(DEFAULT_TOKEN_USAGE);
          setBusy(false);
          break;
        default:
          break;
      }
    });

    loadInitialState();
    return () => {
      unsubscribe();
    };
  }, []);

  const selectedModelId = useMemo(() => {
    const currentOption = modelOptions.find(
      (option) => option.name === modelConfig.name && option.effort === modelConfig.effort
    );
    return currentOption?.id ?? modelOptions[0]?.id ?? 1;
  }, [modelConfig]);

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    await window.coda.saveApiKey(trimmed);
    setApiKey(trimmed);
    setApiKeyInput('');
    setMessages([createWelcomeMessage()]);
    setStatusMessage('API key saved.');
  };

  const handleRemoveApiKey = async () => {
    await window.coda.deleteApiKey();
    setApiKey(null);
    setStatusMessage('API key removed.');
  };

  const handleModelChange = async (modelId: number) => {
    const selected = modelOptions.find((option) => option.id === modelId);
    if (!selected) return;
    const config: ModelConfig = { name: selected.name, effort: selected.effort };
    await window.coda.saveModelConfig(config);
    setModelConfig(config);
    setStatusMessage(`Model set to ${selected.label}.`);
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim() || !apiKey || busy) return;
    setStatusMessage(null);
    setBusy(true);
    await window.coda.runAgent({ prompt, mode });
    setPrompt('');
  };

  const handleReview = async () => {
    if (!apiKey || busy) return;
    setStatusMessage(null);
    setBusy(true);
    await window.coda.runReview();
  };

  const handleReset = async () => {
    await window.coda.resetConversation();
    setMessages([createWelcomeMessage()]);
    setTokenUsage(DEFAULT_TOKEN_USAGE);
  };

  if (!initialized) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>coda</h1>
          <p style={styles.bodyText}>Enter your OpenRouter API key to get started.</p>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            placeholder="sk-or-..."
            style={styles.input}
          />
          <button type="button" style={styles.primaryButton} onClick={handleSaveApiKey}>
            Save API Key
          </button>
          {statusMessage && <p style={styles.status}>{statusMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>coda</h1>
          <p style={styles.subHeading}>AI coding agent with local tools</p>
        </div>
        <div style={styles.headerControls}>
          <label style={styles.label}>
            Mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as Mode)}
              style={styles.select}
            >
              <option value="agent">Agent</option>
              <option value="plan">Plan</option>
            </select>
          </label>
          <label style={styles.label}>
            Model
            <select
              value={selectedModelId}
              onChange={(event) => handleModelChange(Number(event.target.value))}
              style={styles.select}
            >
              {modelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" style={styles.secondaryButton} onClick={handleReview} disabled={busy}>
            Run Review
          </button>
          <button type="button" style={styles.secondaryButton} onClick={handleReset} disabled={busy}>
            Reset Conversation
          </button>
          <button type="button" style={styles.secondaryButton} onClick={handleRemoveApiKey} disabled={busy}>
            Remove API Key
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <section style={styles.messagesPane}>
          {messages.map((message) => (
            <div key={message.id} style={styles.messageBubble(message.author)}>
              <div style={styles.messageHeader}>
                <span style={styles.messageAuthor(message.author)}>{message.author}</span>
                {message.timestamp && <span style={styles.timestamp}>{message.timestamp}</span>}
              </div>
              <div>{message.chunks.map((chunk, index) => renderChunk(chunk, index))}</div>
            </div>
          ))}
        </section>
        <section style={styles.inputPane}>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={busy ? 'Agent is working...' : 'Ask coda for help...'}
            style={styles.textarea}
            disabled={busy}
            rows={4}
          />
          <div style={styles.inputActions}>
            <button type="button" style={styles.primaryButton} onClick={handleSubmitPrompt} disabled={busy}>
              {busy ? 'Working...' : 'Send'}
            </button>
            <div style={styles.tokenUsage}>
              <span>Input: {tokenUsage.input}</span>
              <span>Output: {tokenUsage.output}</span>
              <span>Total: {tokenUsage.total}</span>
            </div>
          </div>
          {statusMessage && <p style={styles.status}>{statusMessage}</p>}
        </section>
      </main>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    padding: '2rem',
    boxSizing: 'border-box' as const,
  },
  heading: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 600,
  },
  subHeading: {
    margin: '0.25rem 0 0',
    color: '#94a3b8',
  },
  card: {
    maxWidth: '32rem',
    margin: '4rem auto',
    padding: '2rem',
    borderRadius: '1rem',
    backgroundColor: '#1e293b',
    boxShadow: '0 20px 30px rgba(15, 23, 42, 0.4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  headerControls: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    alignItems: 'center',
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    fontSize: '0.85rem',
    color: '#cbd5f5',
    gap: '0.25rem',
  },
  select: {
    padding: '0.4rem 0.6rem',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
  },
  main: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  messagesPane: {
    flex: 1,
    backgroundColor: '#121c30',
    borderRadius: '1rem',
    padding: '1.5rem',
    maxHeight: '55vh',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  messageBubble: (author: Message['author']) => ({
    padding: '1rem',
    borderRadius: '0.75rem',
    backgroundColor: author === 'user' ? '#1e293b' : '#16213b',
    border: '1px solid #1d2839',
  }),
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    color: '#a5b4fc',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  messageAuthor: (author: Message['author']) => ({
    fontWeight: 600,
    color: author === 'user' ? '#38bdf8' : author === 'agent' ? '#c084fc' : '#e2e8f0',
  }),
  timestamp: {
    color: '#64748b',
  },
  messageParagraph: {
    margin: '0.3rem 0',
    lineHeight: 1.5,
  },
  codeBlock: {
    backgroundColor: '#0b1220',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    overflowX: 'auto' as const,
    border: '1px solid #1e293b',
  },
  errorText: {
    margin: '0.3rem 0',
    color: '#f87171',
  },
  toolExecution: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: '#131f35',
    border: '1px dashed #2563eb',
  },
  toolExecutionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    color: '#93c5fd',
  },
  toolExecutionName: {
    fontWeight: 600,
  },
  toolExecutionStatus: (status: ToolExecution['status']) => ({
    textTransform: 'capitalize' as const,
    color: status === 'error' ? '#f97316' : status === 'success' ? '#22c55e' : '#eab308',
  }),
  toolExecutionOutput: {
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  inputPane: {
    backgroundColor: '#121c30',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    color: '#e2e8f0',
    resize: 'vertical' as const,
    minHeight: '6rem',
  },
  inputActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  primaryButton: {
    padding: '0.6rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: '#6366f1',
    border: 'none',
    color: '#f8fafc',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    margin: '0.75rem 0',
  },
  bodyText: {
    margin: '0.5rem 0',
  },
  status: {
    margin: 0,
    color: '#38bdf8',
  },
  tokenUsage: {
    display: 'flex',
    gap: '1rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};
