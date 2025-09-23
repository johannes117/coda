import { render } from 'ink';
import { App } from './ui/App.js';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { getStoredApiKey } from './utils/apiKey.js';

/**
 * Main entry point for the Coda CLI application.
 */
export async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('prompt', {
      alias: 'p',
      type: 'string',
      description: 'Run a non-interactive prompt.',
    })
    .help()
    .parse();
  // If a non-interactive prompt is provided, handle it and exit.
  if (argv.prompt) {
    const apiKey = await getStoredApiKey();
    if (!apiKey) {
      console.error('OpenAI API key not set. Run interactive mode first to configure.');
      process.exit(1);
    }
    console.log(`User Prompt: ${argv.prompt}`);
    console.log('Coda Response: This is a dummy response for your non-interactive prompt.');
    process.exit(0);
  }
  // Otherwise, start the interactive UI.
  // Ink handles its own cleanup, so we can render directly.
  const instance = render(<App />);
  await instance.waitUntilExit();
}
