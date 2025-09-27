import { create } from 'zustand';
import type { ModelConfig, Message, ToolExecutionStatus, TokenUsage } from '@types';
import { randomUUID } from 'crypto';

const createWelcomeMessage = (): Message => ({
  id: randomUUID(),
  author: 'system',
  chunks: [{ kind: 'text', text: 'Welcome to coda! I can help you with your coding tasks. What should we work on?' }],
});

type Store = {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  modelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id'>) => void;
  resetMessages: () => void;
  updateToolExecution: (toolCallId: string, status: ToolExecutionStatus, output: string) => void;
  tokenUsage: TokenUsage;
  updateTokenUsage: (usage: { input: number; output: number }) => void;
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
  modelConfig: { name: 'openai/gpt-5', effort: 'medium' },
  setModelConfig: (config: ModelConfig) => set({ modelConfig: config }),
  messages: [createWelcomeMessage()],
  addMessage: (msg: Omit<Message, 'id'>) => set((state) => ({ messages: [...state.messages, { ...msg, id: randomUUID() }] })),
  resetMessages: () => set({ messages: [createWelcomeMessage()], tokenUsage: { input: 0, output: 0, total: 0 } }),
  updateToolExecution: (toolCallId: string, status: ToolExecutionStatus, output: string) =>
    set((state) => ({
      messages: state.messages.map((message) => ({
        ...message,
        chunks: message.chunks.map((chunk) => {
          if (chunk.kind === 'tool-execution' && chunk.toolCallId === toolCallId) {
            return { ...chunk, status, output };
          }
          return chunk;
        }),
      })),
    })),
  tokenUsage: { input: 0, output: 0, total: 0 },
  updateTokenUsage: (usage: { input: number; output: number }) =>
    set((state) => ({
      tokenUsage: {
        input: state.tokenUsage.input + usage.input,
        output: state.tokenUsage.output + usage.output,
        total: state.tokenUsage.total + usage.input + usage.output,
      },
    })),
  busy: false,
  setBusy: (busy: boolean) => set({ busy }),
  blink: true,
  toggleBlink: () => set((state) => ({ blink: !state.blink })),
  terminalCols: process.stdout.columns ?? 80,
  resetRequested: false,
}));

