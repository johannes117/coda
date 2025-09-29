import { Author, Chunk, DiffLine, Message, ModelOption, SlashCommand } from "@types";

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
