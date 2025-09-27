export type Author = 'user' | 'agent' | 'system' | 'tool';
export type ChunkKind = 'text' | 'code' | 'error' | 'list' | 'status' | 'divider' | 'tool-execution';
export type Mode = 'agent' | 'plan';

export type SlashCommand = {
  name: string;
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
