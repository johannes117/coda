import { Text } from 'ink';

export const ErrorLine = ({ text }: { text: string }) => (
  <Text color="redBright">Error: {text}</Text>
);