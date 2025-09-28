import { AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  END,
  START,
  StateGraph,
  MessagesAnnotation,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from '@agent/tools';
// import { logInfo } from '@lib/logger';
import { defaultSystemPrompt } from '@agent/prompts';

export const createAgent = (
  apiKey: string,
  modelConfig: { name: string; effort: string },
  prompt: string = defaultSystemPrompt
) => {
  const modelKwargs = modelConfig.name.startsWith('openai/') ? {
    reasoning_effort: modelConfig.effort,
    verbosity: 'medium'
  } : {};

  const model = new ChatOpenAI({
    apiKey: apiKey,
    model: modelConfig.name,
    temperature: 1,
    modelKwargs: {
      ...modelKwargs,
      usage: { include: true },
    },
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'coda',
      },
    }
  }).bindTools(tools);

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const messages = [
      { role: 'system', content: prompt },
      ...state.messages,
    ];
    const response = await model.invoke(messages); // Can we implement prompt caching here? 
    return { messages: [response] }; 
  };

  const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      return 'tools';
    }
    return END;
  };

  const toolNode = new ToolNode<typeof MessagesAnnotation.State>(tools);

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent');

  return workflow.compile();
};
