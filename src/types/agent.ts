import type { Message, ModelConfig } from './index.js';

export type RunnerDeps = {
  apiKey: string;
  modelConfig: ModelConfig;
  push: (message: Omit<Message, 'id'>) => void;
  updateToolExecution: (toolCallId: string, status: any, output: string) => void;
  updateTokenUsage: (usage: { input: number; output: number }) => void;
  setBusy: (busy: boolean) => void;
};