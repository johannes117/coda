import { useCallback, useRef, useState } from 'react';
import { useApp, useInput } from 'ink';
import { randomUUID } from 'crypto';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { saveSession, storeModelConfig } from '@lib/storage';
import { nowTime } from '@lib/time';
import { useStore } from '@app/store.js';
import type { ModelConfig, Mode } from '@types';
import { modelOptions } from '@lib/models.js';
import { useBusyText } from '@tui/hooks/useBusyText.js';
import { useFileSearchMenu } from '@tui/hooks/useFileSearchMenu.js';
import { useCommandMenu } from '@tui/hooks/useCommandMenu.js';
import { useModelMenu } from '@tui/hooks/useModelMenu.js';
import { runAgentStream } from '@app/agent-runner.js';
import { executeSlashCommand } from '@app/command-executor.js';
import { slashCommands } from '@app/commands.js';
import type { AppState } from '@types';
import { defaultSystemPrompt, planSystemPrompt } from '@agent/index.js';

export function useAppState(): AppState {
  const { exit } = useApp();
  const cols = useStore((store) => store.terminalCols);
  const apiKey = useStore((store) => store.apiKey);
  const currentModel = useStore((store) => store.modelConfig);
  const messages = useStore((store) => store.messages);
  const busy = useStore((store) => store.busy);
  const setBusy = useStore((store) => store.setBusy);
  const addMessage = useStore((store) => store.addMessage);
  const updateTokenUsage = useStore((store) => store.updateTokenUsage);
  const updateToolExecution = useStore((store) => store.updateToolExecution);
  const resetMessages = useStore((store) => store.resetMessages);
  const setModelConfig = useStore((store) => store.setModelConfig);
  const clearApiKeyStore = useStore((store) => store.clearApiKey);

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

  const addContextPath = useStore((s) => s.addContextPath);
  const contextPaths = useStore((s) => s.contextPaths);

  // Simple # menu: show current context items (read-only for now)
  const [showContextMenu, setShowContextMenu] = useState(false);

  const currentOption = modelOptions.find(
    (option) => option.name === currentModel.name && option.effort === currentModel.effort
  );
  const currentModelId = currentOption ? currentOption.id : 1;

  const busyText = useBusyText();

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
        setShowContextMenu(false);
      } else if (value.startsWith('/')) {
        filterCommandsFromQuery(value);
        setShowContextMenu(false);
      } else if (/#$/.test(value.trim())) {
        setShowContextMenu(true);
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
        setShowContextMenu(false);
      } else if (showCommandMenu) {
        resetCommandMenu();
      } else if (showFileSearchMenu) {
        resetFileSearchMenu();
      } else if (showContextMenu) {
        setShowContextMenu(false);
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
        // autocomplete and add to context set
        const completed = applyTabCompletion(query);
        const chosen = fileSearchMatches[fileSearchSelectionIndex];
        if (chosen) addContextPath(chosen);
        setQuery(completed);
        return;
      } else if (!showModelMenu) {
        if (showCommandMenu) {
          const selected = filteredCommands[commandSelectionIndex];
          if (selected) setQuery(`/${selected.name} `);
          resetCommandMenu();
          return;
        }
        setMode((prev) => {
          const newMode = prev === 'agent' ? 'plan' : 'agent';

          if (newMode === 'plan') {
            conversationHistory.current[0] = new HumanMessage(planSystemPrompt)
            addMessage({
              author: 'system',
              chunks: [{ kind: 'text', text: 'Starting plan mode...' }],
            });
          } else if (newMode === 'agent') {
            conversationHistory.current[0] = new HumanMessage(defaultSystemPrompt)
            addMessage({
              author: 'system',
              chunks: [{ kind: 'text', text: 'Starting agent mode...' }],
            });
          }
          return newMode;

        });
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
        addMessage({
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

      if (showContextMenu) {
        // close the list and continue
        setShowContextMenu(false);
        if (value.trim() === '#') {
          setQuery('');
          return;
        }
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
            (command) => command.name === cmdName || command.aliases?.includes(cmdName)
          ) || null;

        if (!cmd) {
          const available = slashCommands.map((command) => `/${command.name}`).join(', ');
          addMessage({
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
            addMessage,
            updateToolExecution,
            updateTokenUsage,
            setBusy,
          },
          {
            addMessage,
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
      // auto-add any @paths referenced in the prompt to the Context Set
      const refs = [...value.matchAll(/(?<![\w`])@(\S+)/g)].map(m => m[1]);
      let added = 0;
      for (const r of refs) {
        addContextPath(r);
        added++;
      }
      if (added > 0) {
        addMessage({ author: 'system', chunks: [{ kind: 'text', text: `Added ${added} item(s) to context from prompt.` }] });
      }
      const finalPrompt = value; // no inlining — context is injected separately

      addMessage({
        author: 'user',
        timestamp: nowTime(),
        chunks: [{ kind: 'text', text: value }],
      });
      setQuery('');

      await saveSession('last_session', conversationHistory.current);
      setBusy(true);
      try {
        if (mode === 'plan') {
          await runAgentStream(
            {
              apiKey,
              modelConfig: currentModel,
              addMessage,
              updateToolExecution,
              updateTokenUsage,
              setBusy,
            },
            conversationHistory,
            finalPrompt,
            planSystemPrompt
          );
        } else if (mode === 'agent') {
          await runAgentStream(
            {
              apiKey,
              modelConfig: currentModel,
              addMessage,
              updateToolExecution,
              updateTokenUsage,
              setBusy,
            },
            conversationHistory,
            finalPrompt,
            defaultSystemPrompt
          );
        }
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
      addMessage,
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
      addContextPath,
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
    // context menu
    showContextMenu,
    contextItems: contextPaths,
  };
}