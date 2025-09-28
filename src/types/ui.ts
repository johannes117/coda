import type { SlashCommand, ModelOption } from './index.js';

export type PromptBarProps = {
  query: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void | Promise<void>;
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

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };