import { Text } from 'ink';
import { nowTime } from '@lib/time';

export const StatusLine = ({ text }: { text: string }) => (
  <Text>
    <Text dimColor>Generating... </Text>
    <Text>{text}</Text>
    <Text dimColor> ({nowTime()})</Text>
  </Text>
);

