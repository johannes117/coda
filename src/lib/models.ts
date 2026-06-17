import type { ModelOption, Provider } from '@types';

export const modelOptions: ModelOption[] = [
  { id: 0, label: 'claude-opus-4.8-low', name: 'claude-opus-4-8', provider: 'anthropic', effort: 'low', contextWindow: 1000000 },
  { id: 1, label: 'claude-opus-4.8-medium', name: 'claude-opus-4-8', provider: 'anthropic', effort: 'medium', contextWindow: 1000000 },
  { id: 2, label: 'claude-opus-4.8-high', name: 'claude-opus-4-8', provider: 'anthropic', effort: 'high', contextWindow: 1000000 },
  { id: 3, label: 'claude-opus-4.8-xhigh', name: 'claude-opus-4-8', provider: 'anthropic', effort: 'xhigh', contextWindow: 1000000 },
  { id: 4, label: 'gpt-5.5-low', name: 'gpt-5.5', provider: 'openai', effort: 'low', contextWindow: 400000 },
  { id: 5, label: 'gpt-5.5-medium', name: 'gpt-5.5', provider: 'openai', effort: 'medium', contextWindow: 400000 },
  { id: 6, label: 'gpt-5.5-high', name: 'gpt-5.5', provider: 'openai', effort: 'high', contextWindow: 400000 },
  { id: 7, label: 'gpt-5.5-xhigh', name: 'gpt-5.5', provider: 'openai', effort: 'xhigh', contextWindow: 400000 },
  { id: 8, label: 'glm-5.2-none', name: 'accounts/fireworks/models/glm-5p2', provider: 'fireworks', effort: 'none', contextWindow: 200000 },
  { id: 9, label: 'glm-5.2-high', name: 'accounts/fireworks/models/glm-5p2', provider: 'fireworks', effort: 'high', contextWindow: 200000 },
  { id: 10, label: 'glm-5.2-max', name: 'accounts/fireworks/models/glm-5p2', provider: 'fireworks', effort: 'max', contextWindow: 200000 },
  { id: 11, label: 'kimi-k2.7', name: 'accounts/fireworks/models/kimi-k2p7-instruct', provider: 'fireworks', effort: 'medium', contextWindow: 256000 },
];

export function getProviderForModel(modelName: string): Provider | null {
  const model = modelOptions.find(m => m.name === modelName || m.label === modelName);
  return model?.provider ?? null;
}

export function isKnownModelConfig(name: string, effort: string): boolean {
  return modelOptions.some(m => m.name === name && m.effort === effort);
}
