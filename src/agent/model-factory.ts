import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type { ModelConfig, ApiKeys } from '@types';

// Fireworks exposes an OpenAI-compatible Chat Completions API, so we reuse
// ChatOpenAI and just point it at the Fireworks inference endpoint.
const FIREWORKS_BASE_URL = 'https://api.fireworks.ai/inference/v1';

type ChatModelOptions = {
  bindTools?: boolean;
};

export function createChatModel(
  apiKeys: ApiKeys,
  modelConfig: ModelConfig,
  _options: ChatModelOptions = { bindTools: false }
) {
  const { provider, name, effort } = modelConfig;

  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey: apiKeys.openai,
        model: name,
        temperature: 1,
        // gpt-5.x rejects `reasoning_effort` + function tools on
        // /v1/chat/completions; the Responses API supports both, but it
        // nests these under `reasoning.effort` and `text.verbosity`.
        useResponsesApi: true,
        modelKwargs: {
          reasoning: { effort },
          text: { verbosity: 'medium' },
        },
      });
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: apiKeys.anthropic,
        model: name,
        temperature: 1,
        maxTokens: 8192,
        invocationKwargs: {
          thinking: { type: 'adaptive' },
          output_config: { effort },
        },
      });
    case 'fireworks':
      return new ChatOpenAI({
        apiKey: apiKeys.fireworks,
        model: name,
        temperature: 1,
        configuration: {
          baseURL: FIREWORKS_BASE_URL,
        },
        // Fireworks exposes reasoning control through the OpenAI-compatible
        // `reasoning_effort` field on /chat/completions. For glm-5.2 the
        // meaningful values are 'none' (reasoning off), 'high', and 'max'.
        modelKwargs: {
          reasoning_effort: effort,
        },
      });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
