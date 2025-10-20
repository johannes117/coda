import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createAgent } from '@agent/graph';
import { defaultSystemPrompt, reviewSystemPrompt } from '@agent/prompts';
import { processStreamUpdate } from '@app/stream-processor.js';
import { saveSession } from '@lib/storage';
import { logError } from '@lib/logger';
import { AGENT_RECURSION_LIMIT } from '@lib/constants';
import type { RunnerDeps, StreamProcessorActions } from '@types';
import { useStore } from '@app/store.js';
import { buildFileContextBlob } from '@lib/context.js';

export async function runAgentStream(
  deps: RunnerDeps,
  conversationHistory: { current: BaseMessage[] },
  finalPrompt: string,
  systemPrompt: string = defaultSystemPrompt
) {
  const { apiKey, modelConfig, addMessage, updateToolExecution, updateTokenUsage, setBusy } = deps;
  const agentInstance = createAgent(apiKey, modelConfig, systemPrompt);

  // persist the user's turn in history
  const userMsg = new HumanMessage(finalPrompt);
  conversationHistory.current.push(userMsg);
  await saveSession('last_session', conversationHistory.current);
  setBusy(true);
  try {
    const actions: StreamProcessorActions = { addMessage, updateToolExecution, updateTokenUsage };

    // Build a fresh, live snapshot of file context (not saved to history).
    const contextPaths = useStore.getState().contextPaths;
    const blob = await buildFileContextBlob(contextPaths);
    const initialMessages = blob
      ? [...conversationHistory.current.slice(0, -1), new SystemMessage(blob), userMsg]
      : [...conversationHistory.current];

    const stream = await agentInstance.stream(
      { messages: initialMessages },
      { recursionLimit: AGENT_RECURSION_LIMIT }
    );
    for await (const chunk of stream) {
      await processStreamUpdate(chunk, conversationHistory, actions);
    }
  } catch (error) {
    const errorMsg = `An error occurred: ${error instanceof Error ? error.message : String(error)}`;
    await logError(errorMsg);
    addMessage({ author: 'system', chunks: [{ kind: 'error', text: errorMsg }] });
  } finally {
    setBusy(false);
  }
}

export async function runReview(
  deps: RunnerDeps,
  conversationHistory: { current: BaseMessage[] },
  systemPrompt: string = reviewSystemPrompt
) {
  const { apiKey, modelConfig, addMessage, updateToolExecution, updateTokenUsage, setBusy } = deps;
  const reviewAgent = createAgent(apiKey, modelConfig, systemPrompt);
  const userMessage = new HumanMessage(
    'Please conduct a code review of the current branch against the base branch (main or master).'
  );
  conversationHistory.current.push(userMessage);
  addMessage({ author: 'system', chunks: [{ kind: 'text', text: 'Starting code review...' }] });
  await saveSession('last_session', conversationHistory.current);
  setBusy(true);
  try {
    const actions: StreamProcessorActions = { addMessage, updateToolExecution, updateTokenUsage };
    const stream = await reviewAgent.stream(
      { messages: conversationHistory.current },
      { recursionLimit: AGENT_RECURSION_LIMIT }
    );
    for await (const chunk of stream) {
      await processStreamUpdate(chunk, conversationHistory, actions);
    }
  } catch (error) {
    const errorMsg = `An error occurred: ${error instanceof Error ? error.message : String(error)}`;
    await logError(errorMsg);
    addMessage({ author: 'system', chunks: [{ kind: 'error', text: errorMsg }] });
  } finally {
    setBusy(false);
  }
}
