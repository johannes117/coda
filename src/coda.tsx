import { render } from 'ink';
import { App } from './tui/App.js';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { getStoredApiKey, storeApiKey, deleteStoredApiKey, getStoredModelConfig } from './utils/storage.js';
import { clearLog, logInfo, logError } from './utils/logger.js';
import { useStore } from './store/index.js';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'node:process';

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
  const storedModelConfig = await getStoredModelConfig();
  if (storedModelConfig) {
    useStore.setState({ modelConfig: storedModelConfig });
  }
  let running = true;
  while (running) {
    let apiKey = await getStoredApiKey();
    if (!apiKey) {
      const rl = createInterface({ input: stdin, output: stdout });
      try {
        console.log('\nWelcome to coda!');
        console.log('Enter your Openrouter API key to get started:');
        apiKey = await rl.question('> ');
        if (!apiKey?.trim()) {
          process.exit(0);
        }
        await storeApiKey(apiKey.trim());
        apiKey = apiKey.trim();
        console.log('API key stored. Starting coda...\n');
      } catch (err) {
        if (err instanceof Error && err.message.includes('Stdin')) {
          process.exit(0);
        }
        throw err;
      } finally {
        rl.close();
      }
    }
    useStore.setState({ apiKey });
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
    const resetRequested = useStore.getState().resetRequested;
    if (resetRequested) {
      useStore.setState({
        resetRequested: false,
        apiKey: null,
        messages: [],
      });
      await deleteStoredApiKey();
    } else {
      running = false;
    }
  }
}
