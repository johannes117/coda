import { create } from 'zustand';
import type { ModelConfig, Message, TokenUsage, ToolExecution } from '@types';
import { createWelcomeMessage } from '@lib/messages.js';
import { generateId } from '@lib/id.js';

type Store = {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  modelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id'>) => void;
  resetMessages: () => void;
  updateToolExecution: (toolExecution: ToolExecution) => void;
  tokenUsage: TokenUsage;
  updateTokenUsage: (usage: TokenUsage) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  blink: boolean;
  toggleBlink: () => void;
  terminalCols: number;
  resetRequested: boolean;
};

export const useStore = create<Store>((set, get) => ({
  apiKey: null,
  setApiKey: (key: string) => set({ apiKey: key }),
  clearApiKey: () => set({ apiKey: null }),
  modelConfig: { name: 'anthropic/claude-sonnet-4.5', effort: 'medium' },
  setModelConfig: (config: ModelConfig) => set({ modelConfig: config }),
  messages: [createWelcomeMessage()],
  addMessage: (msg: Omit<Message, 'id'>) =>
    set((state) => ({ messages: [...state.messages, { ...msg, id: generateId() }] })),
  resetMessages: () => set({ messages: [createWelcomeMessage()], tokenUsage: { input: 0, output: 0, total: 0 } }),
  updateToolExecution: (toolExecution: ToolExecution) =>
    set((state) => ({
      messages: state.messages.map((message) => ({
        ...message,
        chunks: message.chunks.map((chunk) => {
          if (chunk.kind === 'tool-execution' && chunk.toolCallId === toolExecution.toolCallId) {
            return { ...chunk, status: toolExecution.status, output: toolExecution.output };
          }
          return chunk;
        }),
      })),
    })),  
  tokenUsage: { input: 0, output: 0, total: 0 },
  updateTokenUsage: (usage: TokenUsage) =>
    set({
      tokenUsage: {
        input: usage.input,
        output: usage.output,
        total: usage.total,
      },
    }),
  busy: false,
  setBusy: (busy: boolean) => set({ busy }),
  blink: true,
  toggleBlink: () => set((state) => ({ blink: !state.blink })),
  terminalCols: 120,
  resetRequested: false,
}));

