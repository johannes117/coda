import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { ModelConfig, ApiKeys } from '@types';

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
        modelKwargs: {
          reasoning_effort: effort,
          verbosity: 'medium',
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
    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey: apiKeys.google,
        model: name,
        temperature: 1,
      });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
