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

const systemPrompt = `You are Coda, an expert AI software engineer.
Your goal is to help users with their coding tasks by interacting with their local filesystem.
You have access to the following tools:
- list_files: List files in a directory.
- read_file: Read the content of a file.
- write_file: Write content to a file.
- execute_shell_command: Execute a shell command.
Follow this process:
1. **Analyze:** Understand the user's request and the current state of the filesystem.
2. **Plan:** Break down the task into a sequence of steps. Use the tools provided to gather information and make changes.
3. **Execute:** Call one tool at a time.
4. **Observe:** Analyze the output of the tool. If an error occurs, try to fix it.
5. **Repeat:** Continue this cycle until you have completed the user's request.
6. **Conclude:** When the task is complete, respond to the user with a summary of what you have done. Do not call any more tools.`;

/**
 * Factory for creating the agent with a given API key and model config.
 */
export const createAgent = (apiKey: string, modelConfig: { name: string; effort: string }) => {
  // Initialize the OpenAI model with tool-calling capabilities.
  // Using GPT-5 with medium reasoning effort for complex coding tasks
  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    model: modelConfig.name,
    temperature: 1,
    // Configure for medium reasoning effort - good balance for coding tasks
    modelKwargs: {
      reasoning_effort: modelConfig.effort,
      verbosity: 'medium'
    }
  }).bindTools(tools);

  /**
   * The 'callModel' node is the primary "thinker" of our agent.
   * It invokes the LLM with the current message history and the system prompt.
   * It returns a partial state update with the AIMessage response.
   */
  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...state.messages,
    ];
    const response = await model.invoke(messages);
    return { messages: [response] };
  };

  /**
   * The 'shouldContinue' function is a conditional edge that determines
   * the next step in the graph based on the LLM's response.
   */
  const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      return 'tools';
    }
    return END;
  };

  const toolNode = new ToolNode<typeof MessagesAnnotation.State>(tools);

  // Define the graph structure using the MessagesAnnotation for state.
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent');

  // Compile the graph into a runnable agent
  return workflow.compile();
};