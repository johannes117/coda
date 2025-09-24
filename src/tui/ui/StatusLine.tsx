import { Text } from 'ink';
import { nowTime } from '../../utils/helpers.js';

export const StatusLine = ({ text }: { text: string }) => (
  <Text>
    <Text dimColor>Generating... </Text>
    <Text>{text}</Text>
    <Text dimColor> ({nowTime()})</Text>
  </Text>
);