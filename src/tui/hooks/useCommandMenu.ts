import { useCallback, useState } from 'react';
import type { SlashCommand } from '@types';
import { slashCommands } from '@app/commands.js';

export function useCommandMenu() {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>(slashCommands);
  const [commandSelectionIndex, setCommandSelectionIndex] = useState(0);

  const open = useCallback(() => setShowCommandMenu(true), []);
  const close = useCallback(() => setShowCommandMenu(false), []);

  const reset = useCallback(() => {
    setShowCommandMenu(false);
    setFilteredCommands(slashCommands);
    setCommandSelectionIndex(0);
  }, []);

  const filterFromQuery = useCallback((value: string) => {
    if (!value.startsWith('/')) {
      reset();
      return;
    }
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
  }, [reset]);

  return {
    // state
    showCommandMenu,
    filteredCommands,
    commandSelectionIndex,
    // setters
    setCommandSelectionIndex,
    setFilteredCommands,
    // controls
    open,
    close,
    reset,
    // behavior
    filterFromQuery,
  };
}