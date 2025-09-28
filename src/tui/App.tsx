import { useCallback, useMemo, useState, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { createAgent } from '@agent/graph';
import { reviewSystemPrompt } from '@agent/prompts';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { deleteStoredApiKey, saveSession, storeModelConfig } from '@lib/storage';
import { randomUUID } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { logError } from '@lib/logger';
import type {
  Mode,
  ModelConfig,
  ModelOption,
  Message,
  SlashCommand,
} from '@types';
import { modelOptions } from '@config/models';
import { nowTime } from '@lib/time';
import { searchFiles } from '@lib/file-search.js';
import { useStore } from '@tui/core/state.js';
import { HeaderBar } from './components/HeaderBar.js';
import { MessageView } from './components/MessageView.js';
import { Footer } from './components/Footer.js';
import { CommandMenu } from './components/CommandMenu.js';
import { ModelMenu } from './components/ModelMenu.js';
import { FileSearchMenu } from './components/FileSearchMenu.js';
import { slashCommands } from '@tui/core/commands.js';
import { processStreamUpdate } from '@tui/core/stream-processor.js';

const BUSY_TEXT_OPTIONS = [
  'vibing...',
  'noodling...',
  'pondering...',
  'thinking really hard...',
  'spinning up...',
  'connecting the dots...',
  'brewing ideas...',
  'cooking...',
  'crunching...',
  'scheming...',
  'processing...'
] as const;

export const App = () => {
  const { exit } = useApp();
  const cols = useStore((s) => s.terminalCols);
  const apiKey = useStore((s) => s.apiKey);
  const currentModel = useStore((s) => s.modelConfig);
  const messages = useStore((s) => s.messages);
  const busy = useStore((s) => s.busy);
  const setBusy = useStore((s) => s.setBusy);
  const addMessage = useStore((s) => s.addMessage);
  const updateTokenUsage = useStore((s) => s.updateTokenUsage);
  const updateToolExecution = useStore((s) => s.updateToolExecution);
  const resetMessages = useStore((s) => s.resetMessages);
  const setModelConfig = useStore((s) => s.setModelConfig);
  const clearApiKeyStore = useStore((s) => s.clearApiKey);
  const [mode, setMode] = useState<Mode>('agent');
  const [query, setQuery] = useState('');
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>(slashCommands);
  const [commandSelectionIndex, setCommandSelectionIndex] = useState(0);
  const [filteredModels, setFilteredModels] = useState<ModelOption[]>(modelOptions);
  const [modelSelectionIndex, setModelSelectionIndex] = useState(0);
  const [showFileSearchMenu, setShowFileSearchMenu] = useState(false);
  const [fileSearchMatches, setFileSearchMatches] = useState<string[]>([]);
  const [fileSearchSelectionIndex, setFileSearchSelectionIndex] = useState(0);
  const fileSearchQueryRef = useRef<string | null>(null);
  const fileSearchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const agentInstance = useMemo(
    () => (apiKey ? createAgent(apiKey, currentModel) : null),
    [apiKey, currentModel]
  );
  const [sessionId] = useState(() => randomUUID());
  const conversationHistory = useRef<BaseMessage[]>([]);
  const currentOption = modelOptions.find((o) => o.name === currentModel.name && o.effort === currentModel.effort);
  const currentId = currentOption ? currentOption.id : 5;

  const busyText = useMemo(() => {
    const idx = Math.floor(Math.random() * BUSY_TEXT_OPTIONS.length);
    return BUSY_TEXT_OPTIONS[idx];
  }, [busy]);

  const push = useCallback((message: Omit<Message, 'id'>) => {
    addMessage(message);
  }, [addMessage]);

  const resetCommandMenu = useCallback(() => {
    setShowCommandMenu(false);
    setFilteredCommands(slashCommands);
    setCommandSelectionIndex(0);
  }, [slashCommands]);

  const resetFileSearchMenu = useCallback(() => {
    setShowFileSearchMenu(false);
    setFileSearchMatches([]);
    setFileSearchSelectionIndex(0);
    fileSearchQueryRef.current = null;
  }, []);

  const triggerFileSearch = useCallback((query: string) => {
    if (fileSearchDebounceTimer.current) {
      clearTimeout(fileSearchDebounceTimer.current);
    }
    fileSearchDebounceTimer.current = setTimeout(async () => {
      const results = await searchFiles(query, process.cwd());
      setFileSearchMatches(results);
      setShowFileSearchMenu(results.length > 0);
      setFileSearchSelectionIndex(0);
    }, 150); // 150ms debounce
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      resetFileSearchMenu();
      resetCommandMenu();

      if (showModelMenu) {
        const input = value.toLowerCase();
        if (!input) {
          setFilteredModels(modelOptions);
          setModelSelectionIndex(0);
          return;
        }

        const matches = modelOptions.filter(
          (option) =>
            option.label.toLowerCase().includes(input) ||
            String(option.id).startsWith(input)
        );
        setFilteredModels(matches);
        setModelSelectionIndex(0);
        return;
      }

      const lastWordMatch = value.match(/@(\S*)$/);
      if (lastWordMatch) {
        const fileQuery = lastWordMatch[1];
        fileSearchQueryRef.current = lastWordMatch[0];
        setShowFileSearchMenu(true);
        if (fileQuery) {
          triggerFileSearch(fileQuery);
        } else {
          setFileSearchMatches([]); // Show menu, but no results yet
        }
      } else if (value.startsWith('/')) {
        const inputCommand = value.slice(1).toLowerCase();
        const matches = slashCommands.filter((command) => {
          if (!inputCommand) return true;
          return (
            command.name.startsWith(inputCommand) ||
            command.aliases?.some((alias) => alias.startsWith(inputCommand))
          );
        });
        setFilteredCommands(matches);
        if (matches.length > 0) {
          setShowCommandMenu(true);
          setCommandSelectionIndex(0);
        } else {
          setShowCommandMenu(false);
          setCommandSelectionIndex(0);
        }
      } else {
        // Handled by resets at top of function
      }
    },
    [modelOptions, resetCommandMenu, showModelMenu, slashCommands, resetFileSearchMenu, triggerFileSearch]
  );

  useInput((input, key) => {
    if (key.escape) {
      if (busy) {
        setBusy(false);
      } else if (showModelMenu) {
        setShowModelMenu(false);
        setQuery('');
        setFilteredModels(modelOptions);
        setModelSelectionIndex(0);
        resetCommandMenu();
      } else if (showCommandMenu) {
        setShowCommandMenu(false);
      } else if (showFileSearchMenu) {
        resetFileSearchMenu();
      } else {
        exit();
      }
      return;
    }
    if (showModelMenu) {
      if (key.upArrow) {
        setModelSelectionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (key.downArrow) {
        setModelSelectionIndex((prev) =>
          prev < filteredModels.length - 1 ? prev + 1 : prev
        );
        return;
      }
    }

    if (showFileSearchMenu) {
      if (key.upArrow) {
        setFileSearchSelectionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (key.downArrow) {
        setFileSearchSelectionIndex((prev) =>
          prev < fileSearchMatches.length - 1 ? prev + 1 : prev
        );
        return;
      }
    }

    if (key.tab) {
      if (showFileSearchMenu) {
        const selectedFile = fileSearchMatches[fileSearchSelectionIndex];
        if (selectedFile && fileSearchQueryRef.current) {
          const currentQuery = query;
          const queryStart = currentQuery.lastIndexOf(fileSearchQueryRef.current);
          if (queryStart !== -1) {
            const newQuery =
              currentQuery.substring(0, queryStart) + `@${selectedFile} `;
            setQuery(newQuery);
          }
        }
        resetFileSearchMenu();
        return;
      } else if (!showModelMenu) {
        if (showCommandMenu) {
          const selected = filteredCommands[commandSelectionIndex];
          if (selected) {
            setQuery(`/${selected.name} `);
          }
          resetCommandMenu();
          return;
        }
        setMode(prev => prev === 'agent' ? 'plan' : 'agent');
        return;
      }
    }
    if (showCommandMenu) {
      if (key.upArrow) {
        setCommandSelectionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (key.downArrow) {
        setCommandSelectionIndex((prev) => {
          if (filteredCommands.length === 0) return prev;
          return prev < filteredCommands.length - 1 ? prev + 1 : prev;
        });
        return;
      }
    }
  });

  const handleSubmit = useCallback(
    async (value: string) => {
      if (showModelMenu) {
        const selectedModel = filteredModels[modelSelectionIndex];
        if (!selectedModel) {
          return;
        }

        const newConfig: ModelConfig = { name: selectedModel.name, effort: selectedModel.effort };
        setModelConfig(newConfig);
        await storeModelConfig(newConfig);
        push({
          author: 'system',
          chunks: [{ kind: 'text', text: `Model switched to ${selectedModel.label}` }],
        });
        setShowModelMenu(false);
        setFilteredModels(modelOptions);
        setModelSelectionIndex(0);
        setQuery('');
        resetCommandMenu();
        return;
      }

      if (showFileSearchMenu) {
        const selectedFile = fileSearchMatches[fileSearchSelectionIndex];
        if (selectedFile && fileSearchQueryRef.current) {
          const queryStart = value.lastIndexOf(fileSearchQueryRef.current);
          if (queryStart !== -1) {
            const newQuery = value.substring(0, queryStart) + `@${selectedFile} `;
            setQuery(newQuery);
          }
        }
        resetFileSearchMenu();
        return;
      }

      const selected = showCommandMenu ? filteredCommands[commandSelectionIndex] : undefined;
      const effectiveValue = selected ? `/${selected.name}` : value;
      const trimmedValue = effectiveValue.trim();

      if (!trimmedValue || busy || !agentInstance) {
        if (!trimmedValue) {
          setQuery('');
          resetCommandMenu();
        }
        return;
      }
      const command = trimmedValue.toLowerCase();
      if (command.startsWith('/')) {
        const cmdName = command.slice(1).split(' ')[0];
        const cmd = slashCommands.find((c) => c.name === cmdName || c.aliases?.includes(cmdName));

        if (!cmd) {
          const available = slashCommands.map((c) => `/${c.name}`).join(', ');
          push({
            author: 'system',
            chunks: [{ kind: 'error', text: `Unknown command: ${trimmedValue}. Available commands: ${available}` }],
          });
          setQuery('');
          resetCommandMenu();
          return;
        }

        if (cmd.name === 'quit') {
          resetCommandMenu();
          push({ author: 'system', chunks: [{ kind: 'text', text: 'Goodbye!' }] });
          setTimeout(() => exit(), 100);
          return;
        }
        if (cmd.name === 'reset') {
          resetCommandMenu();
          await deleteStoredApiKey();
          clearApiKeyStore();
          resetMessages();
          conversationHistory.current = [];
          setQuery('');
          useStore.setState({ resetRequested: true });
          exit();
          return;
        }
        if (cmd.name === 'status') {
          resetCommandMenu();
          const cwd = process.cwd().replace(process.env.HOME || '', '~');
          const tokenUsage = useStore.getState().tokenUsage;
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
  • Input: ${tokenUsage.input}
  • Output: ${tokenUsage.output}
  • Total: ${tokenUsage.total}`;
          push({ author: 'system', chunks: [{ kind: 'text', text: statusText }] });
          setQuery('');
          return;
        }
        if (cmd.name === 'clear') {
          resetCommandMenu();
          resetMessages();
          conversationHistory.current = [];
          push({ author: 'system', chunks: [{ kind: 'text', text: 'New conversation started.' }] });
          setQuery('');
          return;
        }
        if (cmd.name === 'model') {
          resetCommandMenu();
          setShowModelMenu(true);
          setFilteredModels(modelOptions);
          setModelSelectionIndex(0);
          setQuery('');
          return;
        }
        if (cmd.name === 'review') {
          resetCommandMenu();
          if (!apiKey) {
            push({
              author: 'system',
              chunks: [{ kind: 'error', text: 'API key not found. Cannot start review.' }],
            });
            return;
          }
          const reviewAgent = createAgent(apiKey, currentModel, reviewSystemPrompt);
          const userMessage = new HumanMessage(
            'Please conduct a code review of the current branch against the base branch (main or master).'
          );
          conversationHistory.current.push(userMessage);
          push({
            author: 'system',
            chunks: [{ kind: 'text', text: 'Starting code review...' }],
          });
          setQuery('');
          await saveSession('last_session', conversationHistory.current);
          setBusy(true);
          try {
            const actions = { push, updateToolExecution, updateTokenUsage };
            const stream = await reviewAgent.stream(
              { messages: conversationHistory.current },
              { recursionLimit: 150 }
            );
            for await (const chunk of stream) {
              await processStreamUpdate(chunk, conversationHistory, actions);
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
          return;
        }
      }

      resetCommandMenu();

      let finalPrompt = value;
      const fileRegex = /(?<![\w`])@(\S+)/g;
      const matches = [...value.matchAll(fileRegex)];

      if (matches.length > 0) {
        const augmentedContent: string[] = [];
        const filesToRead = matches.map(match => ({
          alias: match[0],
          filePath: path.resolve(process.cwd(), match[1]),
          relativePath: match[1],
        }));

        for (const file of filesToRead) {
          try {
            const content = await fs.readFile(file.filePath, 'utf-8');
            augmentedContent.push(`Content from ${file.relativePath}:\n---\n${content}\n---`);
          } catch (e) {
            augmentedContent.push(`Could not read file ${file.relativePath}. Error: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        finalPrompt = `${augmentedContent.join('\n\n')}\n\nUser request: ${value}`;
      }
      // --- End @ File Reference Processing ---

      const userMessage = new HumanMessage(finalPrompt);
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

        const actions = { push, updateToolExecution, updateTokenUsage };
        const stream = await agentInstance.stream(
          { messages: conversationHistory.current },
          { recursionLimit: 150 }
        );
        for await (const chunk of stream) {
          await processStreamUpdate(chunk, conversationHistory, actions);
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
    [
      busy,
      push,
      mode,
      exit,
      agentInstance,
      currentModel,
      sessionId,
      resetMessages,
      clearApiKeyStore,
      updateToolExecution,
      showCommandMenu,
      showModelMenu,
      filteredCommands,
      filteredModels,
      commandSelectionIndex,
      modelSelectionIndex,
      resetCommandMenu,
      modelOptions,
      setModelConfig,
      storeModelConfig,
      slashCommands,
      resetFileSearchMenu,
      showFileSearchMenu,
      fileSearchMatches,
      fileSearchSelectionIndex
    ]
  );
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
            <Text> {busyText}</Text>
          </Box>
        )}
      </Box>
      {!busy && (
        <Box flexDirection="column">
          <Box marginTop={1} alignItems="center">
            <Text color="cyan" bold>&gt; </Text>
            <TextInput
              value={query}
              onChange={handleQueryChange}
              onSubmit={handleSubmit}
              placeholder={showModelMenu ? 'Filter models by name or ID...' : ' Ask coda anything...'}
            />
          </Box>
          {showCommandMenu && filteredCommands.length > 0 && (
            <CommandMenu commands={filteredCommands} selectedIndex={commandSelectionIndex} />
          )}
          {showFileSearchMenu && (
            <FileSearchMenu matches={fileSearchMatches} selectedIndex={fileSearchSelectionIndex} />
          )}
          {showModelMenu && filteredModels.length > 0 && (
            <ModelMenu models={filteredModels} selectedIndex={modelSelectionIndex} currentModelId={currentId} />
          )}
        </Box>
      )}
      <Footer working={busy} mode={mode} />
    </Box>
  );
};
