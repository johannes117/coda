import type { ModelOption } from '../types/index.js';

export const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const modelOptions: ModelOption[] = [
  { id: 1, label: 'grok-code-fast-1', name: 'x-ai/grok-code-fast-1', effort: 'medium' },
  { id: 2, label: 'claude-sonnet-4', name: 'anthropic/claude-sonnet-4', effort: 'medium' },
  { id: 3, label: 'grok-4-fast:free', name: 'x-ai/grok-4-fast:free', effort: 'medium' },
  { id: 4, label: 'gpt-5-low', name: 'openai/gpt-5', effort: 'low' },
  { id: 5, label: 'gpt-5-medium', name: 'openai/gpt-5', effort: 'medium' },
  { id: 6, label: 'gpt-5-high', name: 'openai/gpt-5', effort: 'high' },
];