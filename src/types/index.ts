export type Author = 'user' | 'agent' | 'system' | 'tool';
export type ChunkKind = 'text' | 'code' | 'error' | 'list' | 'status' | 'divider' | 'tool-call' | 'tool-result';
export type Mode = 'agent' | 'plan';
export type ModelOption = { id: number; label: string; name: string; effort: string };
export type ModelConfig = { name: string; effort: string };
export type Chunk = {
  kind: ChunkKind;
  text?: string;
  lines?: string[];
  tool?: string;
  toolInput?: Record<string, any>;
};
export type Message = {
  author: Author;
  timestamp?: string;
  chunks: Chunk[];
};