import React from 'react';
import {render} from 'ink';
import {App} from './ui/App.js';
import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';

function enterAltScreen() {
  // Enter alt buffer + move cursor home + clear + hide cursor
  process.stdout.write('\x1b[?1049h\x1b[H\x1b[2J\x1b[?25l');
}

function exitAltScreen() {
  // Show cursor + leave alt buffer
  process.stdout.write('\x1b[?25h\x1b[?1049l');
}

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
    console.log(`User Prompt: ${argv.prompt}`);
    console.log('Coda Response: This is a dummy response for your non-interactive prompt.');
    process.exit(0);
  }

  // Otherwise, start the interactive UI.
  enterAltScreen();

  const cleanup = () => {
    try {
      exitAltScreen();
    } catch {
      // Ignore cleanup errors so shutdown still proceeds.
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });
  process.on('uncaughtException', err => {
    cleanup();
    throw err;
  });

  const instance = render(<App />);
  await instance.waitUntilExit();

  cleanup();
}
