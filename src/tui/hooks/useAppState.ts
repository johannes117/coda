import { useCallback, useRef, useState } from 'react';
import { useApp, useInput } from 'ink';
import { randomUUID } from 'crypto';
import type { BaseMessage } from '@langchain/core/messages';
import { saveSession, storeModelConfig } from '@lib/storage';
import { nowTime } from '@lib/time';
import { useStore } from '@tui/core/store.js';
import type { Message, ModelConfig, ModelOption, Mode } from '@types';
import { modelOptions } from '@lib/models.js';
import { useBusyText } from '@tui/hooks/useBusyText.js';
import { useFileSearchMenu } from '@tui/hooks/useFileSearchMenu.js';
import { useCommandMenu } from '@tui/hooks/useCommandMenu.js';
import { useModelMenu } from '@tui/hooks/useModelMenu.js';
import { runAgentStream } from '@tui/core/agent-runner.js';
import { executeSlashCommand } from '@tui/core/command-executor.js';
import { slashCommands } from '@tui/core/commands.js';
import { augmentPromptWithFiles } from '@lib/prompt-augmentation.js';

export type AppState = {
  // UI data
  cols: number;
  messages: Message[];
  busy: boolean;
  mode: Mode;
  currentModel: ModelConfig;
  currentModelId: number;
  busyText: string;
  // Prompt
  query: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => Promise<void>;
  setQuery: (v: string) => void;
  // Menus
  showCommandMenu: boolean;
  filteredCommands: typeof slashCommands;
  commandSelectionIndex: number;
  setCommandSelectionIndex: (i: number) => void;
  showModelMenu: boolean;
  filteredModels: ModelOption[];
  modelSelectionIndex: number;
  setModelSelectionIndex: (i: number) => void;
  showFileSearchMenu: boolean;
  fileSearchMatches: string[];
  fileSearchSelectionIndex: number;
  setFileSearchSelectionIndex: (i: number) => void;
};

export function useAppState(): AppState {
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
  const [sessionId] = useState(() => randomUUID());
  const conversationHistory = useRef<BaseMessage[]>([]);

  // Menus
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

  const currentOption = modelOptions.find(
    (o) => o.name === currentModel.name && o.effort === currentModel.effort
  );
  const currentModelId = currentOption ? currentOption.id : 5;

  const busyText = useBusyText();

  const push = useCallback(
    (message: Omit<Message, 'id'>) => addMessage(message),
    [addMessage]
  );

  const onChange = useCallback(
    (value: string) => {
      setQuery(value);
      resetFileSearchMenu();
      resetCommandMenu();

      if (showModelMenu) {
        filterModelsFromQuery(value);
        return;
      }
      if (/@(\S*)$/.test(value)) {
        handleAtReference(value);
      } else if (value.startsWith('/')) {
        filterCommandsFromQuery(value);
      }
    },
    [
      showModelMenu,
      filterModelsFromQuery,
      handleAtReference,
      filterCommandsFromQuery,
      resetFileSearchMenu,
      resetCommandMenu,
    ]
  );

  // Keybindings
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

    // Model menu nav
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

    // File search menu nav
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
          if (selected) setQuery(`/${selected.name} `);
          resetCommandMenu();
          return;
        }
        setMode((prev) => (prev === 'agent' ? 'plan' : 'agent'));
        return;
      }
    }

    // Command menu nav
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

  const onSubmit = useCallback(
    async (value: string) => {
      // Model menu: pick a model
      if (showModelMenu) {
        const selectedModel = filteredModels[modelSelectionIndex];
        if (!selectedModel) return;
        const newConfig: ModelConfig = {
          name: selectedModel.name,
          effort: selectedModel.effort,
        };
        setModelConfig(newConfig);
        await storeModelConfig(newConfig);
        push({
          author: 'system',
          chunks: [
            { kind: 'text', text: `Model switched to ${selectedModel.label}` },
          ],
        });
        closeModelMenu();
        resetModelMenu();
        setQuery('');
        resetCommandMenu();
        return;
      }

      // File search menu: accept completion
      if (showFileSearchMenu) {
        setQuery(applySubmitSelection(value));
        return;
      }

      // If command menu is open, commit selected command (shortcut)
      const selected = showCommandMenu
        ? filteredCommands[commandSelectionIndex]
        : undefined;
      const effectiveValue = selected ? `/${selected.name}` : value;
      const trimmedValue = effectiveValue.trim();

      if (!trimmedValue || busy || !apiKey) {
        if (!trimmedValue) {
          setQuery('');
          resetCommandMenu();
        }
        return;
      }

      // Slash command path
      const isCommand = trimmedValue.startsWith('/');
      if (isCommand) {
        const cmdName = trimmedValue.slice(1).split(' ')[0].toLowerCase();
        const cmd =
          slashCommands.find(
            (c) => c.name === cmdName || c.aliases?.includes(cmdName)
          ) || null;

        if (!cmd) {
          const available = slashCommands.map((c) => `/${c.name}`).join(', ');
          push({
            author: 'system',
            chunks: [
              {
                kind: 'error',
                text: `Unknown command: ${trimmedValue}. Available commands: ${available}`,
              },
            ],
          });
          setQuery('');
          resetCommandMenu();
          return;
        }

        const handled = await executeSlashCommand(
          cmd.name,
          {
            apiKey,
            modelConfig: currentModel,
            push,
            updateToolExecution,
            updateTokenUsage,
            setBusy,
          },
          {
            push,
            resetMessages: () => {
              resetMessages();
              conversationHistory.current = [];
            },
            clearApiKeyStore,
            setShowModelMenu: openModelMenu,
            setFilteredModels: () => {},
            setModelSelectionIndex,
            setQuery,
            exit,
            apiKey,
            currentModel,
            sessionId,
          }
        );
        resetCommandMenu();
        if (handled) {
          setQuery('');
          return;
        }
      }

      // Regular prompt
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
              chunks: [
                {
                  kind: 'text',
                  text: `[PLAN MODE] I would help you with: "${value}"`,
                },
              ],
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
            setBusy,
          },
          conversationHistory,
          finalPrompt
        );
      } catch {
        // runAgentStream already reports
      } finally {
        setBusy(false);
      }
    },
    [
      apiKey,
      busy,
      closeModelMenu,
      currentModel,
      filteredCommands,
      filteredModels,
      commandSelectionIndex,
      modelSelectionIndex,
      mode,
      openModelMenu,
      push,
      resetCommandMenu,
      resetMessages,
      setBusy,
      setModelConfig,
      setModelSelectionIndex,
      showCommandMenu,
      showFileSearchMenu,
      showModelMenu,
      updateTokenUsage,
      updateToolExecution,
      exit,
      applySubmitSelection,
    ]
  );

  return {
    cols,
    messages,
    busy,
    mode,
    currentModel,
    currentModelId,
    busyText,
    query,
    onChange,
    onSubmit,
    setQuery,
    showCommandMenu,
    filteredCommands,
    commandSelectionIndex,
    setCommandSelectionIndex,
    showModelMenu,
    filteredModels,
    modelSelectionIndex,
    setModelSelectionIndex,
    showFileSearchMenu,
    fileSearchMatches,
    fileSearchSelectionIndex,
    setFileSearchSelectionIndex,
  };
}