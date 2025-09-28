import { useCallback, useState, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { BaseMessage } from '@langchain/core/messages';
import { saveSession, storeModelConfig } from '@lib/storage';
import { randomUUID } from 'crypto';
import type {
  Mode,
  ModelConfig,
  Message,
} from '@types';
import { modelOptions } from '@config/models';
import { nowTime } from '@lib/time';
import { useStore } from '@tui/core/state.js';
import { HeaderBar } from './components/HeaderBar.js';
import { MessageView } from './components/MessageView.js';
import { Footer } from './components/Footer.js';
import { CommandMenu } from './components/CommandMenu.js';
import { ModelMenu } from './components/ModelMenu.js';
import { FileSearchMenu } from './components/FileSearchMenu.js';
import { slashCommands } from '@tui/core/commands.js';
import { useBusyText } from './hooks/useBusyText.js';
import { useFileSearchMenu } from './hooks/useFileSearchMenu.js';
import { useCommandMenu } from './hooks/useCommandMenu.js';
import { useModelMenu } from './hooks/useModelMenu.js';
import { runAgentStream } from './core/agentRunner.js';
import { executeSlashCommand } from './core/commandExecutor.js';
import { augmentPromptWithFiles } from './core/promptAugmentation.js';


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
  const {
    showCommandMenu,
    filteredCommands,
    commandSelectionIndex,
    setCommandSelectionIndex,
    filterFromQuery: filterCommandsFromQuery,
    reset: resetCommandMenu,
  } = useCommandMenu();
  const {
    showModelMenu,
    filteredModels,
    modelSelectionIndex,
    setModelSelectionIndex,
    open: openModelMenu,
    close: closeModelMenu,
    filterFromQuery: filterModelsFromQuery,
    reset: resetModelMenu,
  } = useModelMenu();
  const {
    showFileSearchMenu,
    fileSearchMatches,
    fileSearchSelectionIndex,
    setFileSearchSelectionIndex,
    resetFileSearchMenu,
    handleAtReference,
    applyTabCompletion,
    applySubmitSelection,
  } = useFileSearchMenu();
  const [sessionId] = useState(() => randomUUID());
  const conversationHistory = useRef<BaseMessage[]>([]);
  const currentOption = modelOptions.find((o) => o.name === currentModel.name && o.effort === currentModel.effort);
  const currentId = currentOption ? currentOption.id : 5;

  const busyText = useBusyText();

  const push = useCallback((message: Omit<Message, 'id'>) => {
    addMessage(message);
  }, [addMessage]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      resetFileSearchMenu();
      resetCommandMenu();

      if (showModelMenu) {
        filterModelsFromQuery(value);
        return;
      }

      // Handle @file references (delegated hook)
      if (/@(\S*)$/.test(value)) {
        handleAtReference(value);
      } else if (value.startsWith('/')) {
        filterCommandsFromQuery(value);
      } else {
        // Handled by resets at top of function
      }
    },
    [modelOptions, resetCommandMenu, showModelMenu, filterModelsFromQuery, filterCommandsFromQuery, resetFileSearchMenu, handleAtReference]
  );

  useInput((_input, key) => {
    if (key.escape) {
      if (busy) {
        setBusy(false);
      } else if (showModelMenu) {
        closeModelMenu();
        setQuery('');
        resetModelMenu();
        resetCommandMenu();
      } else if (showCommandMenu) {
        resetCommandMenu();
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
        setQuery(applyTabCompletion(query));
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
        closeModelMenu();
        resetModelMenu();
        setQuery('');
        resetCommandMenu();
        return;
      }

      if (showFileSearchMenu) {
        setQuery(applySubmitSelection(value));
        return;
      }

      const selected = showCommandMenu ? filteredCommands[commandSelectionIndex] : undefined;
      const effectiveValue = selected ? `/${selected.name}` : value;
      const trimmedValue = effectiveValue.trim();

      if (!trimmedValue || busy || !apiKey) {
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

        // Use centralized command executor
        const handled = await executeSlashCommand(
          cmd.name,
          {
            apiKey,
            modelConfig: currentModel,
            push,
            updateToolExecution,
            updateTokenUsage,
            setBusy
          },
          {
            push,
            resetMessages: () => { resetMessages(); conversationHistory.current = []; },
            clearApiKeyStore,
            setShowModelMenu: openModelMenu,
            setFilteredModels: () => {}, // no-op, handled by hook
            setModelSelectionIndex,
            setQuery,
            exit,
            apiKey,
            currentModel,
            sessionId
          }
        );
        resetCommandMenu();
        if (handled) {
          setQuery('');
          return;
        }
      }

      resetCommandMenu();

      const finalPrompt = await augmentPromptWithFiles(value);

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
        await runAgentStream(
          {
            apiKey,
            modelConfig: currentModel,
            push,
            updateToolExecution,
            updateTokenUsage,
            setBusy
          },
          conversationHistory,
          finalPrompt
        );
      } catch (error) {
        // runAgentStream already reports; this catch remains for safety
      } finally {
        setBusy(false);
      }
    },
    [
      busy,
      push,
      mode,
      exit,
      apiKey,
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
      applySubmitSelection
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
