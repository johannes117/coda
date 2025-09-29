import type { ModelOption } from '@types';

export const modelOptions: ModelOption[] = [
  { id: 1, label: 'claude-sonnet-4.5', name: 'anthropic/claude-sonnet-4.5', effort: 'medium', contextWindow: 1000000 }, // 1 Million
  { id: 2, label: 'claude-sonnet-4', name: 'anthropic/claude-sonnet-4', effort: 'medium', contextWindow: 1000000 }, // 1 Million
  { id: 3, label: 'grok-4-fast:free', name: 'x-ai/grok-4-fast:free', effort: 'medium', contextWindow: 2000000 }, // 2 Million
  { id: 4, label: 'gpt-5-low', name: 'openai/gpt-5', effort: 'low', contextWindow: 400000 },
  { id: 5, label: 'gpt-5-medium', name: 'openai/gpt-5', effort: 'medium', contextWindow: 400000 },
  { id: 6, label: 'gpt-5-high', name: 'openai/gpt-5', effort: 'high', contextWindow: 400000 },
  { id: 7, label: 'gpt-5-codex-low', name: 'openai/gpt-5-codex', effort: 'low', contextWindow: 400000 },
  { id: 8, label: 'gpt-5-codex-medium', name: 'openai/gpt-5-codex', effort: 'medium', contextWindow: 400000 },
  { id: 9, label: 'gpt-5-codex-high', name: 'openai/gpt-5-codex', effort: 'high', contextWindow: 400000 },
];

