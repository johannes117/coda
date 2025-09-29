import { Text } from 'ink';
import type { BubblePrefixProps } from '@types';
  
export const BubblePrefix = ({ author }: BubblePrefixProps) => {
  if (author === 'user') return <Text color="cyan" bold>{'> '}</Text>;
  if (author === 'agent') return <Text color="green" bold>{'✦ '}</Text>;
  if (author === 'tool') return <Text color="#ffcc00" bold>{'⚡ '}</Text>;
  return <Text color="magenta" bold>{'• '}</Text>;
};

