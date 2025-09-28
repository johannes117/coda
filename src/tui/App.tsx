import { useCallback, useState, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { BaseMessage } from '@langchain/core/messages';
import { saveSession, storeModelConfig } from '@lib/storage';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  Mode,
  ModelConfig,
  ModelOption,
  Message,
  SlashCommand,
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
import { runAgentStream } from './core/agentRunner.js';
import { executeSlashCommand } from './core/commandExecutor.js';


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

  const resetCommandMenu = useCallback(() => {
    setShowCommandMenu(false);
    setFilteredCommands(slashCommands);
    setCommandSelectionIndex(0);
  }, [slashCommands]);


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

      // Handle @file references (delegated hook)
      if (/@(\S*)$/.test(value)) {
        handleAtReference(value);
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
    [modelOptions, resetCommandMenu, showModelMenu, slashCommands, resetFileSearchMenu, handleAtReference]
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
        setShowModelMenu(false);
        setFilteredModels(modelOptions);
        setModelSelectionIndex(0);
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
            setShowModelMenu,
            setFilteredModels,
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
