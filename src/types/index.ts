export type Author = 'user' | 'agent' | 'system' | 'tool';
export type ChunkKind = 'text' | 'code' | 'error' | 'list' | 'tool-execution';
export type Mode = 'agent' | 'plan';
export type SlashCommandName = "help" | "quit" | "reset" | "status" | "clear" | "model" | "review";

export type SlashCommand = {
  name: SlashCommandName;
  description: string;
  aliases?: string[];
};

export type ModelOption = { 
  id: number; 
  label: string; 
  name: string; 
  effort: string; 
  contextWindow: number 
};

export type ModelConfig = { 
  name: string; 
  effort: string 
};

export type ToolExecutionStatus = 'running' | 'success' | 'error';

export type Chunk = {
  kind: ChunkKind;
  text?: string;
  lines?: string[];
  // for 'tool-execution'
  toolCallId?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  status?: ToolExecutionStatus;
  output?: string;
};

export type Message = {
  id: string;
  author: Author;
  timestamp?: string;
  chunks: Chunk[];
};

export type TokenUsage = { input: number; output: number; total: number };

export type DiffLine = {
  type: 'add' | 'remove' | 'context';
  oldLine?: number;
  newLine?: number;
  text: string;
};

export type RunnerDeps = {
  apiKey: string;
  modelConfig: ModelConfig;
  addMessage: (message: Omit<Message, 'id'>) => void;
  updateToolExecution: (toolExecution: ToolExecution) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  setBusy: (busy: boolean) => void;
};

export type CommandCtx = {
  addMessage: (message: Omit<Message, 'id'>) => void;
  resetMessages: () => void;
  clearApiKeyStore: () => void;
  setShowModelMenu: (v: boolean) => void;
  setFilteredModels: (v: ModelOption[]) => void;
  setModelSelectionIndex: (i: number) => void;
  setQuery: (v: string) => void;
  exit: () => void;
  apiKey: string | null;
  currentModel: ModelConfig;
  sessionId: string;
};


export type StreamProcessorActions = {
  addMessage: (message: Omit<Message, 'id'>) => void;
  updateToolExecution: (toolExecution: ToolExecution) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
}

export type ToolExecution = {
  toolCallId: string;
  status: ToolExecutionStatus;
  output: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

