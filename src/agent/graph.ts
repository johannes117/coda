import { AIMessage } from '@langchain/core/messages';
import {
  END,
  START,
  StateGraph,
  MessagesAnnotation,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from '@agent/tools';
import { createChatModel } from '@agent/model-factory.js';
import { defaultSystemPrompt, evalSystemPrompt } from '@agent/prompts';
import type { ApiKeys, ModelConfig } from '@types';

export const createAgent = (
  apiKeys: ApiKeys,
  modelConfig: ModelConfig,
  prompt: string = defaultSystemPrompt
) => {
  const model = createChatModel(apiKeys, modelConfig);

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

export const createEvalAgent = (
  apiKeys: ApiKeys,
  modelConfig: ModelConfig,
  prompt: string = evalSystemPrompt
) => {
  const model = createChatModel(apiKeys, modelConfig, { bindTools: false });

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const messages = [
      { role: 'system', content: prompt },
      ...state.messages,
    ];
    const response = await model.invoke(messages);
    return { messages: [response] };
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addEdge(START, 'agent')
    .compile();

  return workflow;
};