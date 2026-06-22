import { BaseMessage } from "@langchain/core/messages";

export type Author = "user" | "agent" | "system" | "tool";
export type ChunkKind = "text" | "code" | "error" | "list" | "tool-execution";
export type Mode = "agent" | "plan";
export type SlashCommandName =
  | "help"
  | "quit"
  | "reset"
  | "status"
  | "clear"
  | "model"
  | "review"
  | "apikeys"
  | "resume";
export type Provider = "openai" | "anthropic" | "fireworks";
export type Effort = "none" | "low" | "medium" | "high" | "xhigh" | "max";

export type ApiKeys = {
  openai?: string;
  anthropic?: string;
  fireworks?: string;
};

export type SlashCommand = {
  name: SlashCommandName;
  description: string;
  aliases?: string[];
};

export type ModelOption = {
  id: number;
  label: string;
  name: string;
  provider: Provider;
  effort: Effort;
  contextWindow: number;
};

export type ModelConfig = {
  name: string;
  provider: Provider;
  effort: Effort;
};

export type ApiKeyAction = "set" | "delete";

export type ApiKeyMenuItem = {
  provider: Provider;
  action: ApiKeyAction;
  label: string;
  detail: string;
};

export type ToolExecutionStatus = "running" | "success" | "error";

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
  type: "add" | "remove" | "context";
  oldLine?: number;
  newLine?: number;
  text: string;
};

export type StructuredPatchHunk = {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
};

export type RunnerDeps = {
  apiKeys: ApiKeys;
  modelConfig: ModelConfig;
  addMessage: (message: Omit<Message, "id">) => void;
  updateToolExecution: (toolExecution: ToolExecution) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  setBusy: (busy: boolean) => void;
  saveSession: (history: BaseMessage[]) => Promise<void>;
};

export type CommandCtx = {
  addMessage: (message: Omit<Message, "id">) => void;
  resetMessages: () => void;
  clearApiKeys: () => void;
  setShowModelMenu: (v: boolean) => void;
  setFilteredModels: (v: ModelOption[]) => void;
  setModelSelectionIndex: (i: number) => void;
  setQuery: (v: string) => void;
  exit: () => void;
  requestUiClear?: () => void;
  openApiKeysMenu?: () => void;
  openResumeMenu?: () => void;
  apiKeys: ApiKeys;
  currentModel: ModelConfig;
  sessionId: string;
};

export type StreamProcessorActions = {
  addMessage: (message: Omit<Message, "id">) => void;
  updateToolExecution: (toolExecution: ToolExecution) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
};

export type ToolExecution = {
  toolCallId: string;
  status: ToolExecutionStatus;
  output: string;
};

// ── Session persistence types ─────────────────────────────────────────
//
// SessionData is the full envelope written to ~/.coda/sessions/<id>.json.
// SessionMeta is the lightweight metadata returned by listSessions() for
// the picker — it omits the message arrays.

export type SessionData = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  modelConfig: ModelConfig;
  tokenUsage: TokenUsage;
  firstPrompt: string;
  messages: BaseMessage[];
  uiMessages: Message[];
};

export type SessionMeta = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  firstPrompt: string;
  modelConfig: ModelConfig;
  tokenUsage: TokenUsage;
  messageCount: number;
};

export type SessionMenuItem = {
  sessionId: string;
  label: string;
  detail: string;
  meta: SessionMeta;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export * from "./tui.js";
export * from "./text-input.js";
