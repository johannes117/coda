import { Text } from 'ink';
import type { Author } from '../../types/index.js';

export const BubblePrefix = ({ author }: { author: Author }) => {
  if (author === 'user') return <Text color="cyan" bold>{'> '}</Text>;
  if (author === 'agent') return <Text color="green" bold>{'✦ '}</Text>;
  if (author === 'tool') return <Text color="#ffcc00" bold>{'⚡ '}</Text>;
  return <Text color="magenta" bold>{'• '}</Text>;
};