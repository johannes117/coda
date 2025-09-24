import type { SlashCommand } from './types/index.js';

export const slashCommands: SlashCommand[] = [
  { name: 'status', description: 'View the status of the agent and workspace.' },
  { name: 'model', description: 'Switch to a different model.' },
  { name: 'review', description: 'Request a PR review of the current branch against the base branch.' },
  { name: 'reset', description: 'Reset the agent and clear the API key.' },
  { name: 'clear', description: 'Start a new conversation.', aliases: ['new'] },
  { name: 'quit', description: 'Exit the application.', aliases: ['exit'] },
];
