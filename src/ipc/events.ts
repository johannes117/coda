import type { Message, ModelConfig, Mode, TokenUsage, ToolExecution } from '@types';

export type AgentBusyEvent = { type: 'busy'; payload: boolean };
export type AgentMessageEvent = { type: 'message'; payload: Message };
export type AgentTokenUsageEvent = { type: 'tokenUsage'; payload: TokenUsage };
export type AgentToolExecutionEvent = { type: 'toolExecution'; payload: ToolExecution };
export type AgentErrorEvent = { type: 'error'; payload: string };
export type AgentResetEvent = { type: 'reset' };

export type AgentEvent =
  | AgentBusyEvent
  | AgentMessageEvent
  | AgentTokenUsageEvent
  | AgentToolExecutionEvent
  | AgentErrorEvent
  | AgentResetEvent;

export type RunAgentPayload = { prompt: string; mode: Mode };

export type InitResponse = {
  apiKey: string | null;
  modelConfig: ModelConfig;
  messages: Message[];
  tokenUsage: TokenUsage;
};
