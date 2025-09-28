import { render } from 'ink';
import { App } from './tui/App.js';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { getStoredApiKey, storeApiKey, deleteStoredApiKey, getStoredModelConfig } from '@lib/storage';
import { clearLog, logInfo, logError } from '@lib/logger';
import { useStore } from '@tui/core/state.js';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'node:process';
import { createAgent } from '@agent/graph';
import { HumanMessage } from '@langchain/core/messages';
import { reviewSystemPrompt } from '@agent/prompts';

export async function main() {
  await clearLog();
  const argv = await yargs(hideBin(process.argv))
    .option('prompt', {
      alias: 'p',
      type: 'string',
      description: 'Run a non-interactive prompt.',
    })
    .option('review', {
      type: 'boolean',
      description: 'Run a one-off code review against base (non-interactive).',
      default: false,
    })
    .option('set-key', {
      type: 'string',
      description: 'Store an OpenRouter API key non-interactively.',
    })
    .option('model', {
      type: 'string',
      description: 'Override model name for this run (e.g. openai/gpt-5).',
    })
    .option('effort', {
      type: 'string',
      choices: ['low', 'medium', 'high'] as const,
      description: 'Override reasoning effort for this run.',
    })
    .help()
    .parse();

  if (argv['set-key']) {
    await storeApiKey(String(argv['set-key']).trim());
    console.log('API key stored.');
    process.exit(0);
  }

  if (argv.prompt || argv.review) {
    const apiKey = await getStoredApiKey();
    if (!apiKey) {
      await logError('OpenAI/OpenRouter API key not set. Run interactive mode or use --set-key to configure.');
      process.exit(1);
    }
    const storedModelConfig = await getStoredModelConfig();
    const modelConfig = {
      name: argv.model ?? storedModelConfig?.name ?? 'anthropic/claude-sonnet-4',
      effort: (argv.effort as string) ?? storedModelConfig?.effort ?? 'medium',
    };

    const agent = createAgent(apiKey, modelConfig, argv.review ? reviewSystemPrompt : undefined as any);
    const input = argv.review
      ? 'Please conduct a code review of the current branch against the base branch (main or master).'
      : String(argv.prompt);

    await logInfo(argv.review ? 'Running one-off review' : `User Prompt: ${input}`);
    try {
      const result = await agent.invoke({ messages: [new HumanMessage(input)] });
      const final = result.messages[result.messages.length - 1];
      const content = typeof final.content === 'string'
        ? final.content
        : Array.isArray(final.content)
            ? final.content.map((c: any) => (typeof c === 'string' ? c : JSON.stringify(c))).join(' ')
            : String(final.content ?? '');
      console.log(content.trim());
      process.exit(0);
    } catch (err: any) {
      await logError(`Non-interactive run failed: ${err?.message ?? String(err)}`);
      console.error(`Error: ${err?.message ?? String(err)}`);
      process.exit(1);
    }
  }
  if (argv.prompt) {
    // Handled above; keep this branch unreachable for safety.
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
