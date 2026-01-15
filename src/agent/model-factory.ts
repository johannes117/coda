import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { ModelConfig, ApiKeys } from '@types';
import { tools } from '@agent/tools';

type ChatModelOptions = {
  bindTools?: boolean;
};

export function createChatModel(
  apiKeys: ApiKeys,
  modelConfig: ModelConfig,
  options: ChatModelOptions = { bindTools: true }
) {
  const { provider, name, effort } = modelConfig;
  const { bindTools: shouldBindTools = true } = options;

  let model;
  switch (provider) {
    case 'openai':
      model = new ChatOpenAI({
        apiKey: apiKeys.openai,
        model: name,
        temperature: 1,
        modelKwargs: {
          reasoning_effort: effort,
          verbosity: 'medium',
          usage: { include: true },
        },
      });
      break;

    case 'anthropic':
      model = new ChatAnthropic({
        apiKey: apiKeys.anthropic,
        model: name,
        temperature: 1,
        maxTokens: 8192,
      });
      break;

    case 'google':
      model = new ChatGoogleGenerativeAI({
        apiKey: apiKeys.google,
        model: name,
        temperature: 1,
      });
      break;

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  return shouldBindTools ? model.bindTools(tools) : model;
}
