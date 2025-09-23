import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

interface Message {
  sender: 'user' | 'coda' | 'system';
  text: string;
}

/**
 * A component to display the conversation history.
 */
const History = ({ messages }: { messages: Message[] }) => (
  <Box flexDirection="column">
    {messages.map((msg, index) => (
      <Box key={index} flexDirection="row">
        <Text color={msg.sender === 'user' ? 'cyan' : 'green'} bold>
          {msg.sender === 'user' ? '> ' : '✦ '}
        </Text>
        <Text>{msg.text}</Text>
      </Box>
    ))}
  </Box>
);

/**
 * The main application component for the Coda CLI.
 */
export const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'system', text: 'Welcome to Coda! How can I help you today?' },
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { exit } = useApp();

  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const handleSubmit = useCallback(
    (value: string) => {
      if (!value.trim()) return;

      addMessage({ sender: 'user', text: value });
      setQuery('');
      setIsLoading(true);

      const normalized = value.trim().toLowerCase();

      if (normalized === '/quit' || normalized === '/exit') {
        addMessage({ sender: 'system', text: 'Goodbye!' });
        setTimeout(() => exit(), 100);
        return;
      }

      // Simulate AI response with a delay
      setTimeout(() => {
        addMessage({
          sender: 'coda',
          text: `This is a dummy response to: "${value}"`,
        });
        setIsLoading(false);
      }, 1000);
    },
    [addMessage, exit]
  );

  useEffect(() => {
    const handleCtrlC = (_: unknown, key: { ctrl: boolean; name: string }) => {
      if (key.ctrl && key.name === 'c') {
        exit();
      }
    };

    process.stdin.on('keypress', handleCtrlC);
    return () => {
      process.stdin.removeListener('keypress', handleCtrlC);
    };
  }, [exit]);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round">
      <History messages={messages} />
      {isLoading && (
        <Box>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> Coda is thinking...</Text>
        </Box>
      )}
      {!isLoading && (
        <Box>
          <Text color="cyan" bold>
            {'>'}
          </Text>
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            placeholder=" Ask Coda anything..."
          />
        </Box>
      )}
    </Box>
  );
};
