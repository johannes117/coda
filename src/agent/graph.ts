import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  END,
  START,
  StateGraph,
  MessagesAnnotation,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from './tools.js';
import { logInfo } from '../utils/logger.js';

const systemPrompt = `You are coda, an expert AI software engineer.
Your goal is to help users with their coding tasks by interacting with their local filesystem.
You have access to the following tools:
- list_files: List files in a directory.
- read_file: Read the content of a file.
- write_file: Write content to a file.
- delete_file: Delete a file.
- execute_shell_command: Execute a shell command.
Follow this process:
1. **Analyze:** Understand the user's request and the current state of the filesystem.
2. **Plan:** Break down the task into a sequence of steps. Use the tools provided to gather information and make changes.
3. **Execute:** Call one tool at a time.
4. **Observe:** Analyze the output of the tool. If an error occurs, try to fix it.
5. **Repeat:** Continue this cycle until you have completed the user's request.
6. **Conclude:** When the task is complete, respond to the user with a summary of what you have done. Do not call any more tools.`;

export const createAgent = (apiKey: string, modelConfig: { name: string; effort: string }) => {
  const modelKwargs = modelConfig.name.startsWith('openai/') ? {
    reasoning_effort: modelConfig.effort,
    verbosity: 'medium'
  } : {};

  const model = new ChatOpenAI({
    apiKey: apiKey,
    model: modelConfig.name,
    temperature: 1,
    modelKwargs,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    }
  }).bindTools(tools);

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...state.messages,
    ];
    const response = await model.invoke(messages);
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