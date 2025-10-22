import type { AgentEvent, InitResponse, RunAgentPayload } from '../ipc/events.js';
import type { ModelConfig } from '@types';

declare global {
  interface Window {
    coda: {
      getInitialState: () => Promise<InitResponse>;
      saveApiKey: (key: string) => Promise<unknown>;
      deleteApiKey: () => Promise<unknown>;
      saveModelConfig: (config: ModelConfig) => Promise<unknown>;
      runAgent: (payload: RunAgentPayload) => Promise<unknown>;
      runReview: () => Promise<unknown>;
      resetConversation: () => Promise<unknown>;
      onAgentEvent: (handler: (event: AgentEvent) => void) => () => void;
    };
  }
}

export {};
