import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseMessage } from '@langchain/core/messages';
import type { Mode, ModelConfig, Message, TokenUsage, ToolExecution } from '@types';
import { getStoredApiKey, storeApiKey, deleteStoredApiKey, getStoredModelConfig, storeModelConfig } from '../lib/storage.js';
import { createWelcomeMessage } from '../lib/messages.js';
import { runAgentStream, runReview } from '../app/agent-runner.js';
import { augmentPromptWithFiles } from '../lib/prompt-augmentation.js';
import { defaultSystemPrompt, planSystemPrompt } from '../agent/prompts.js';
import { generateId } from '../lib/id.js';
import { nowTime } from '../lib/time.js';
import { clearLog, logError } from '../lib/logger.js';
import type { Result } from '@types';
import type { AgentEvent, InitResponse, RunAgentPayload } from '../ipc/events.js';

type ConversationContext = {
  apiKey: string | null;
  modelConfig: ModelConfig;
  busy: boolean;
  history: BaseMessage[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MODEL: ModelConfig = { name: 'anthropic/claude-sonnet-4.5', effort: 'medium' };
const contexts = new Map<number, ConversationContext>();

const getContext = (webContentsId: number): ConversationContext => {
  if (!contexts.has(webContentsId)) {
    contexts.set(webContentsId, {
      apiKey: null,
      modelConfig: DEFAULT_MODEL,
      busy: false,
      history: [],
    });
  }
  return contexts.get(webContentsId)!;
};

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const rendererHtml = path.join(__dirname, '../renderer/index.html');
  await mainWindow.loadFile(rendererHtml);
};

const toRendererMessage = (message: Omit<Message, 'id'>): Message => ({
  ...message,
  id: generateId(),
});

const sendEvent = (webContentsId: number, event: AgentEvent) => {
  const window = BrowserWindow.fromId(webContentsId);
  window?.webContents.send('agent:event', event);
};

const ensureApiKey = (context: ConversationContext, webContentsId: number): Result<string> => {
  if (!context.apiKey) {
    sendEvent(webContentsId, { type: 'error', payload: 'Please set your OpenRouter API key to continue.' });
    return { ok: false, error: 'missing_api_key' };
  }
  return { ok: true, data: context.apiKey };
};

const getSystemPromptForMode = (mode: Mode) => (mode === 'plan' ? planSystemPrompt : defaultSystemPrompt);

const setBusy = (context: ConversationContext, webContentsId: number, busy: boolean) => {
  if (context.busy === busy) return;
  context.busy = busy;
  sendEvent(webContentsId, { type: 'busy', payload: busy });
};

const handleAgentRun = async (webContentsId: number, prompt: string, mode: Mode) => {
  const context = getContext(webContentsId);
  const apiKeyResult = ensureApiKey(context, webContentsId);
  if (!apiKeyResult.ok) return;

  if (context.busy) {
    sendEvent(webContentsId, { type: 'error', payload: 'Agent is already running. Please wait for it to finish.' });
    return;
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    return;
  }

  const userMessage: Message = {
    id: generateId(),
    author: 'user',
    timestamp: nowTime(),
    chunks: [{ kind: 'text', text: prompt }],
  };
  sendEvent(webContentsId, { type: 'message', payload: userMessage });

  const finalPrompt = await augmentPromptWithFiles(prompt);

  const deps = {
    apiKey: apiKeyResult.data,
    modelConfig: context.modelConfig,
    addMessage: (message: Omit<Message, 'id'>) => sendEvent(webContentsId, { type: 'message', payload: toRendererMessage(message) }),
    updateToolExecution: (toolExecution: ToolExecution) =>
      sendEvent(webContentsId, { type: 'toolExecution', payload: toolExecution }),
    updateTokenUsage: (usage: TokenUsage) =>
      sendEvent(webContentsId, { type: 'tokenUsage', payload: usage }),
    setBusy: (busy: boolean) => setBusy(context, webContentsId, busy),
  };

  const conversationRef = { current: context.history };
  try {
    setBusy(context, webContentsId, true);
    await runAgentStream(deps, conversationRef, finalPrompt, getSystemPromptForMode(mode));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logError(`Agent run failed: ${message}`);
    sendEvent(webContentsId, {
      type: 'error',
      payload: `An error occurred while running the agent: ${message}`,
    });
  } finally {
    setBusy(context, webContentsId, false);
  }
};

const handleReviewRun = async (webContentsId: number) => {
  const context = getContext(webContentsId);
  const apiKeyResult = ensureApiKey(context, webContentsId);
  if (!apiKeyResult.ok) return;

  if (context.busy) {
    sendEvent(webContentsId, { type: 'error', payload: 'Agent is already running. Please wait for it to finish.' });
    return;
  }

  const deps = {
    apiKey: apiKeyResult.data,
    modelConfig: context.modelConfig,
    addMessage: (message: Omit<Message, 'id'>) => sendEvent(webContentsId, { type: 'message', payload: toRendererMessage(message) }),
    updateToolExecution: (toolExecution: ToolExecution) =>
      sendEvent(webContentsId, { type: 'toolExecution', payload: toolExecution }),
    updateTokenUsage: (usage: TokenUsage) =>
      sendEvent(webContentsId, { type: 'tokenUsage', payload: usage }),
    setBusy: (busy: boolean) => setBusy(context, webContentsId, busy),
  };

  const conversationRef = { current: context.history };
  try {
    setBusy(context, webContentsId, true);
    await runReview(deps, conversationRef);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logError(`Review run failed: ${message}`);
    sendEvent(webContentsId, {
      type: 'error',
      payload: `An error occurred while running the review: ${message}`,
    });
  } finally {
    setBusy(context, webContentsId, false);
  }
};

const handleReset = (webContentsId: number) => {
  const context = getContext(webContentsId);
  context.history = [];
  sendEvent(webContentsId, { type: 'reset' });
};

app.on('ready', async () => {
  await clearLog();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

ipcMain.handle('app:init', async (event): Promise<InitResponse> => {
  const context = getContext(event.sender.id);
  const apiKey = await getStoredApiKey();
  if (apiKey) {
    context.apiKey = apiKey;
  }
  const storedModel = await getStoredModelConfig();
  if (storedModel) {
    context.modelConfig = storedModel;
  }

  return {
    apiKey: context.apiKey,
    modelConfig: context.modelConfig,
    messages: [createWelcomeMessage()],
    tokenUsage: { input: 0, output: 0, total: 0 } satisfies TokenUsage,
  };
});

ipcMain.handle('storage:saveApiKey', async (event, key: string) => {
  const context = getContext(event.sender.id);
  await storeApiKey(key);
  context.apiKey = key;
  return { ok: true };
});

ipcMain.handle('storage:deleteApiKey', async (event) => {
  const context = getContext(event.sender.id);
  await deleteStoredApiKey();
  context.apiKey = null;
  handleReset(event.sender.id);
  return { ok: true };
});

ipcMain.handle('storage:saveModelConfig', async (event, config: ModelConfig) => {
  const context = getContext(event.sender.id);
  await storeModelConfig(config);
  context.modelConfig = config;
  return { ok: true };
});

ipcMain.handle('agent:run', async (event, payload: RunAgentPayload) => {
  await handleAgentRun(event.sender.id, payload.prompt, payload.mode);
});

ipcMain.handle('agent:review', async (event) => {
  await handleReviewRun(event.sender.id);
});

ipcMain.handle('agent:reset', (event) => {
  handleReset(event.sender.id);
});
