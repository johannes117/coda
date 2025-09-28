import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { CommandMenu } from './CommandMenu.js';
import { FileSearchMenu } from './FileSearchMenu.js';
import { ModelMenu } from './ModelMenu.js';
import type { PromptBarProps } from '../../types/ui.js';

export const PromptBar = (props: PromptBarProps) => {
  const {
    query,
    onChange,
    onSubmit,
    showCommandMenu,
    filteredCommands,
    commandSelectionIndex,
    showFileSearchMenu,
    fileSearchMatches,
    fileSearchSelectionIndex,
    showModelMenu,
    filteredModels,
    modelSelectionIndex,
    currentModelId,
  } = props;

  return (
    <Box flexDirection="column">
      <Box marginTop={1} alignItems="center">
        <Text color="cyan" bold>
          &gt;{' '}
        </Text>
        <TextInput
          value={query}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={
            showModelMenu
              ? 'Filter models by name or ID...'
              : ' Ask coda anything...'
          }
        />
      </Box>

      {showCommandMenu && filteredCommands.length > 0 && (
        <CommandMenu
          commands={filteredCommands}
          selectedIndex={commandSelectionIndex}
        />
      )}

      {showFileSearchMenu && (
        <FileSearchMenu
          matches={fileSearchMatches}
          selectedIndex={fileSearchSelectionIndex}
        />
      )}

      {showModelMenu && filteredModels.length > 0 && (
        <ModelMenu
          models={filteredModels}
          selectedIndex={modelSelectionIndex}
          currentModelId={currentModelId}
        />
      )}
    </Box>
  );
};