import type { Message } from '@types';
import { generateId } from '@lib/id.js';

export function createWelcomeMessage(): Message {
  return {
    id: generateId(),
    author: 'system',
    chunks: [
      {
        kind: 'text',
        text: 'Welcome to coda! I can help you with your coding tasks. What should we work on?',
      },
    ],
  };
}
