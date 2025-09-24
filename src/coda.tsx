import { render } from 'ink';
import { App } from './tui/App.js';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { getStoredApiKey, storeApiKey } from './utils/storage.js';
import { clearLog, logInfo, logError } from './utils/logger.js';
import { useStore } from './store/index.js';
import type { Message } from './types/index.js';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'node:process';

const systemMessage: Message = {
  author: 'system',
  chunks: [{ kind: 'text', text: 'Welcome to coda! I can help you with your coding tasks. What should we work on?' }],
};

export async function main() {
  await clearLog();
  const argv = await yargs(hideBin(process.argv))
    .option('prompt', {
      alias: 'p',
      type: 'string',
      description: 'Run a non-interactive prompt.',
    })
    .help()
    .parse();
  if (argv.prompt) {
    const apiKey = await getStoredApiKey();
    if (!apiKey) {
      await logError('OpenAI API key not set. Run interactive mode first to configure.');
      process.exit(1);
    }
    await logInfo(`User Prompt: ${argv.prompt}`);
    await logInfo('coda Response: This is a dummy response for your non-interactive prompt.');
    process.exit(0);
  }
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const apiKey = await rl.question('Enter your Openrouter API key: ');
      await storeApiKey(apiKey.trim());
      console.log('API key stored. Starting coda...');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Stdin')){
        console.error('Error reading API key:', error);
        process.exit(0);
      }
      throw error;
    } finally {
      rl.close();
    }
  }
  useStore.setState({ apiKey });
  if (apiKey) {
    useStore.setState({ messages: [systemMessage] });
  }
  const updateSize = () => {
    useStore.setState({ terminalCols: process.stdout.columns ?? 80 });
  };
  process.stdout.on('resize', updateSize);
  updateSize();
  const blinkInterval = setInterval(() => {
    const { busy, toggleBlink } = useStore.getState();
    if (busy) {
      toggleBlink();
    }
  }, 600);
  const instance = render(<App />);
  try {
    await instance.waitUntilExit();
  } finally {
    clearInterval(blinkInterval);
    process.stdout.removeListener('resize', updateSize);
  }
}
