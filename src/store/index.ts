import { create } from 'zustand';
import type { ModelConfig, Message } from '../types/index.js';

const systemMessage: Message = {
  author: 'system',
  chunks: [{ kind: 'text', text: 'Welcome to coda! I can help you with your coding tasks. What should we work on?' }],
};

type Store = {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  modelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
  messages: Message[];
  addMessage: (msg: Message) => void;
  resetMessages: () => void;
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
  messages: [],
  addMessage: (msg: Message) => set((state) => ({ messages: [...state.messages, msg] })),
  resetMessages: () => set({ messages: [systemMessage] }),
  busy: false,
  setBusy: (busy: boolean) => set({ busy }),
  blink: true,
  toggleBlink: () => set((state) => ({ blink: !state.blink })),
  terminalCols: process.stdout.columns ?? 80,
  resetRequested: false,
}));