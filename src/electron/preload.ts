import { contextBridge, ipcRenderer } from 'electron';
import type { AgentEvent, InitResponse, RunAgentPayload } from '../ipc/events.js';
import type { ModelConfig } from '@types';

type AgentEventHandler = (event: AgentEvent) => void;

const api = {
  getInitialState: (): Promise<InitResponse> => ipcRenderer.invoke('app:init'),
  saveApiKey: (key: string) => ipcRenderer.invoke('storage:saveApiKey', key),
  deleteApiKey: () => ipcRenderer.invoke('storage:deleteApiKey'),
  saveModelConfig: (config: ModelConfig) => ipcRenderer.invoke('storage:saveModelConfig', config),
  runAgent: (payload: RunAgentPayload) => ipcRenderer.invoke('agent:run', payload),
  runReview: () => ipcRenderer.invoke('agent:review'),
  resetConversation: () => ipcRenderer.invoke('agent:reset'),
  onAgentEvent: (handler: AgentEventHandler) => {
    const listener = (_: Electron.IpcRendererEvent, event: AgentEvent) => handler(event);
    ipcRenderer.on('agent:event', listener);
    return () => ipcRenderer.removeListener('agent:event', listener);
  },
};

contextBridge.exposeInMainWorld('coda', api);
