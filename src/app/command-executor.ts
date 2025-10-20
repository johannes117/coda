import { existsSync } from 'fs';
import { deleteStoredApiKey, saveSession } from '@lib/storage';
import { useStore } from '@app/store.js';
import { modelOptions } from '@lib/models.js';
import { runReview } from '@app/agent-runner.js';
import type { RunnerDeps, CommandCtx, SlashCommandName } from '@types';
import { slashCommands } from '@app/commands.js';
import path from 'path';
import { promises as fs } from 'fs';

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
      const contextCount = useStore.getState().contextPaths.length;
      const statusText = `Status:
  • Path: ${cwd}
  • AGENTS file: ${agentsFile}
  • Model: ${currentModel.name} (${currentModel.effort})
  • Session ID: ${sessionId}
  • Tokens — input: ${tokenUsage.input} | output: ${tokenUsage.output} | total: ${tokenUsage.total}
  • Context Set: ${contextCount} item(s) — type "# " to view`;
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
    case 'context': {
      const input = (ctx as any).query?.trim?.() ?? '';
      // parse args from query; since PromptBar passes only "/context" by default,
      // we'll read the last user input from store messages if needed:
      const last = useStore.getState().messages.at(-1);
      const raw = typeof last?.chunks?.[0]?.text === 'string' ? last!.chunks[0].text : '';
      const line = raw.startsWith('/context') ? raw : input;
      const parts = line.split(/\s+/).slice(1);
      const sub = (parts[0] || 'list').toLowerCase();
      const add = useStore.getState().addContextPath;
      const remove = useStore.getState().removeContextPath;
      const clear = useStore.getState().clearContextPaths;
      const items = useStore.getState().contextPaths;

      if (sub === 'list') {
        if (items.length === 0) {
          addMessage({ author: 'system', chunks: [{ kind: 'text', text: 'Context is empty. Use "/context add @path" or reference @path in your prompt.' }] });
          return true;
        }
        const lines = items.map(p => `• ${p}`);
        addMessage({ author: 'system', chunks: [{ kind: 'list', lines: ['Context Set:', ...lines] }] });
        return true;
      }

      if (sub === 'clear') {
        clear();
        addMessage({ author: 'system', chunks: [{ kind: 'text', text: 'Cleared context set.' }] });
        return true;
      }

      if (sub === 'remove') {
        const toRemove = parts.slice(1);
        if (toRemove.length === 0) {
          addMessage({ author: 'system', chunks: [{ kind: 'error', text: 'Usage: /context remove <path> [more paths...]' }] });
          return true;
        }
        let removed = 0;
        for (const p of toRemove) {
          const rel = p.replace(/^@/, '');
          if (items.includes(rel)) {
            remove(rel); removed++;
          }
        }
        addMessage({ author: 'system', chunks: [{ kind: 'text', text: `Removed ${removed} item(s) from context.` }] });
        return true;
      }

      if (sub === 'add') {
        const toAdd = parts.slice(1);
        if (toAdd.length === 0) {
          addMessage({ author: 'system', chunks: [{ kind: 'error', text: 'Usage: /context add <path|@path> [more...]' }] });
          return true;
        }
        let added = 0;
        for (const rawPath of toAdd) {
          const rel = rawPath.replace(/^@/, '');
          const abs = path.resolve(process.cwd(), rel);
          try {
            await fs.stat(abs);
            add(rel); added++;
          } catch {
            // ignore missing
          }
        }
        addMessage({ author: 'system', chunks: [{ kind: 'text', text: `Added ${added} item(s) to context.` }] });
        return true;
      }

      addMessage({ author: 'system', chunks: [{ kind: 'list', lines: [
        'Context command usage:',
        '  /context list',
        '  /context add <@path|path> [...]',
        '  /context remove <path> [...]',
        '  /context clear',
      ]}]});
      return true;
    }
    default:
      return false;
  }
}