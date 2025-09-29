import { existsSync } from 'fs';
import { deleteStoredApiKey, saveSession } from '@lib/storage';
import { useStore } from '@app/store.js';
import { modelOptions } from '@lib/models.js';
import { runReview } from '@app/agent-runner.js';
import type { RunnerDeps, CommandCtx, SlashCommandName } from '@types';
import { slashCommands } from '@app/commands.js';

export async function executeSlashCommand(
  cmdName: SlashCommandName,
  deps: RunnerDeps,
  ctx: CommandCtx
) {
  const {
    addMessage, resetMessages, clearApiKeyStore, setShowModelMenu,
    setFilteredModels, setModelSelectionIndex, setQuery, exit,
    apiKey, currentModel, sessionId
  } = ctx;

  switch (cmdName) {
    case 'help': {
      const lines = slashCommands.map(c => {
        const alias = c.aliases?.length ? ` (aliases: ${c.aliases.join(', ')})` : '';
        return `  /${c.name}${alias} — ${c.description}`;
      });
      addMessage({ author: 'system', chunks: [{ kind: 'list', lines: ['Commands:', ...lines] }] });
      return true;
    }
    case 'quit': {
      addMessage({ author: 'system', chunks: [{ kind: 'text', text: 'Goodbye!' }] });
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
      addMessage({ author: 'system', chunks: [{ kind: 'text', text: statusText }] });
      return true;
    }
    case 'clear': {
      resetMessages();
      addMessage({ author: 'system', chunks: [{ kind: 'text', text: 'New conversation started.' }] });
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
        addMessage({ author: 'system', chunks: [{ kind: 'error', text: 'API key not found. Cannot start review.' }] });
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