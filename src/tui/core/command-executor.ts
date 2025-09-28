import { existsSync } from 'fs';
import { deleteStoredApiKey, saveSession, storeModelConfig } from '@lib/storage';
import { useStore } from '@tui/core/store.js';
import type { ModelConfig, Message, ModelOption } from '@types';
import { modelOptions } from '@lib/models.js';
import { runReview, RunnerDeps } from '@tui/core/agent-runner.js';

export type CommandCtx = {
  push: (message: Omit<Message, 'id'>) => void;
  resetMessages: () => void;
  clearApiKeyStore: () => void;
  setShowModelMenu: (v: boolean) => void;
  setFilteredModels: (v: ModelOption[]) => void;
  setModelSelectionIndex: (i: number) => void;
  setQuery: (v: string) => void;
  exit: () => void;
  apiKey: string | null;
  currentModel: ModelConfig;
  sessionId: string;
};

export async function executeSlashCommand(
  cmdName: string,
  deps: RunnerDeps,
  ctx: CommandCtx
) {
  const {
    push, resetMessages, clearApiKeyStore, setShowModelMenu,
    setFilteredModels, setModelSelectionIndex, setQuery, exit,
    apiKey, currentModel, sessionId
  } = ctx;

  switch (cmdName) {
    case 'help': {
      const cmds = (await import('./commands.js')).slashCommands;
      const lines = cmds.map(c => {
        const alias = c.aliases?.length ? ` (aliases: ${c.aliases.join(', ')})` : '';
        return `  /${c.name}${alias} — ${c.description}`;
      });
      push({ author: 'system', chunks: [{ kind: 'list', lines: ['Commands:', ...lines] }] });
      return true;
    }
    case 'quit': {
      push({ author: 'system', chunks: [{ kind: 'text', text: 'Goodbye!' }] });
      setTimeout(() => exit(), 100);
      return true;
    }
    case 'reset': {
      await deleteStoredApiKey();
      clearApiKeyStore();
      resetMessages();
      useStore.setState({ resetRequested: true });
      exit();
      return true;
    }
    case 'status': {
      const cwd = process.cwd().replace(process.env.HOME || '', '~');
      const tokenUsage = useStore.getState().tokenUsage;
      const agentsFile = existsSync('AGENTS.md') ? 'AGENTS.md' : 'none';
      const statusText = `Status:
  • Path: ${cwd}
  • AGENTS file: ${agentsFile}
  • Model: ${currentModel.name} (${currentModel.effort})
  • Session ID: ${sessionId}
  • Tokens — input: ${tokenUsage.input} | output: ${tokenUsage.output} | total: ${tokenUsage.total}`;
      push({ author: 'system', chunks: [{ kind: 'text', text: statusText }] });
      return true;
    }
    case 'clear': {
      resetMessages();
      push({ author: 'system', chunks: [{ kind: 'text', text: 'New conversation started.' }] });
      return true;
    }
    case 'model': {
      setShowModelMenu(true);
      setFilteredModels(modelOptions);
      setModelSelectionIndex(0);
      setQuery('');
      return true;
    }
    case 'review': {
      if (!apiKey) {
        push({ author: 'system', chunks: [{ kind: 'error', text: 'API key not found. Cannot start review.' }] });
        return true;
      }
      await saveSession('last_session', useStore.getState().messages as any);
      await runReview(deps, { current: [] as any }); // history updated inside
      return true;
    }
    default:
      return false;
  }
}