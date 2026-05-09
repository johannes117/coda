import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { CommandMenu } from './CommandMenu.js';
import { FileSearchMenu } from './FileSearchMenu.js';
import { ModelMenu } from './ModelMenu.js';
import { themeColor } from '@tui/theme.js';
import { ARROW_RIGHT_THIN } from '@tui/figures.js';
import type { Mode, ModelOption, SlashCommand } from '@types';

type Props = {
  query: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void | Promise<void>;
  mode: Mode;
  // command menu
  showCommandMenu: boolean;
  filteredCommands: SlashCommand[];
  commandSelectionIndex: number;
  // file search
  showFileSearchMenu: boolean;
  fileSearchMatches: string[];
  fileSearchSelectionIndex: number;
  // model menu
  showModelMenu: boolean;
  filteredModels: ModelOption[];
  modelSelectionIndex: number;
  currentModelId: number;
};

const placeholderForMode = (mode: Mode, showModelMenu: boolean): string => {
  if (showModelMenu) return 'Filter models by name or ID…';
  if (mode === 'plan') return 'Plan something with coda…';
  return 'Ask coda anything…';
};

const borderColorForMode = (mode: Mode, showModelMenu: boolean): string => {
  if (showModelMenu) return themeColor('suggestion');
  if (mode === 'plan') return themeColor('planMode');
  return themeColor('promptBorder');
};

export const PromptInput = (props: Props) => {
  const {
    query,
    onChange,
    onSubmit,
    mode,
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

  const borderColor = borderColorForMode(mode, showModelMenu);
  const promptColor =
    mode === 'plan' ? themeColor('planMode') : themeColor('brand');

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="round"
        borderColor={borderColor}
        paddingX={1}
        flexDirection="row"
        alignItems="center"
      >
        <Text color={promptColor} bold>
          {ARROW_RIGHT_THIN}{' '}
        </Text>
        <Box flexGrow={1}>
          <TextInput
            value={query}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder={placeholderForMode(mode, showModelMenu)}
          />
        </Box>
      </Box>

      {showCommandMenu && filteredCommands.length > 0 ? (
        <CommandMenu commands={filteredCommands} selectedIndex={commandSelectionIndex} />
      ) : null}

      {showFileSearchMenu ? (
        <FileSearchMenu matches={fileSearchMatches} selectedIndex={fileSearchSelectionIndex} />
      ) : null}

      {showModelMenu && filteredModels.length > 0 ? (
        <ModelMenu
          models={filteredModels}
          selectedIndex={modelSelectionIndex}
          currentModelId={currentModelId}
        />
      ) : null}
    </Box>
  );
};
