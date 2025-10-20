import { slashCommands } from "@app/commands.js";
import { Author, Chunk, DiffLine, Message, Mode, ModelConfig, ModelOption, SlashCommand } from "@types";

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
    // context menu
    showContextMenu: boolean;
    contextItems: string[];
};

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
    // context menu
    showContextMenu: boolean;
    contextItems: string[];
  };

export type BubblePrefixProps = {
  author: Author;
};

export type MessageViewProps = {
  msg: Message;
};

export type ModelMenuProps = {
    models: ModelOption[];
    selectedIndex: number;
    currentModelId: number;
};

export type DiffRowProps = {
    line: DiffLine;
    pad: number;
};
  
export type DiffViewProps = {
    diffLines: DiffLine[];
};

export type CommandMenuProps = {
    commands: SlashCommand[];
    selectedIndex: number;
};

export type ToolExecutionProps = {
    chunk: Chunk;
};

export type FileSearchMenuProps = {
    matches: string[];
    selectedIndex: number;
};

export type FooterProps = {
    mode: Mode;
};

export type HeaderBarProps = {
    mode: Mode;
    modelConfig: ModelConfig;
};

export type CodeBlockProps = {
    lines: string[];
};