import type { Message, ModelConfig, ModelOption } from './index.js';

export type CommandCtx = {
  push: (message: Omit<Message, 'id'>) => void;
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