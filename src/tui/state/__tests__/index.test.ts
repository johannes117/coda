import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../index.js';
import type { Message, Chunk } from '@types';

const initialState = useStore.getState();

describe('Zustand Store', () => {
  beforeEach(() => {
    useStore.setState(initialState, true);
  });

  it('should reset messages to the initial welcome message', () => {
    useStore.getState().addMessage({
      author: 'user',
      chunks: [{ kind: 'text', text: 'Some message' }],
    });
    expect(useStore.getState().messages.length).toBeGreaterThan(1);

    useStore.getState().resetMessages();
    const { messages } = useStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].chunks[0].text).toContain('Welcome to coda!');
  });

  it('should add a new message to the state', () => {
    const initialMessagesCount = useStore.getState().messages.length;
    
    const newMessage = {
      author: 'user' as const,
      chunks: [{ kind: 'text' as const, text: 'Hello, world!' }],
    };
    
    useStore.getState().addMessage(newMessage);
    
    const { messages } = useStore.getState();
    expect(messages).toHaveLength(initialMessagesCount + 1);
    expect(messages[messages.length - 1].chunks[0].text).toBe('Hello, world!');
    expect(messages[messages.length - 1].author).toBe('user');
    expect(messages[messages.length - 1].id).toBeDefined();
  });

  it('should correctly update a tool execution chunk', () => {
    const toolCallId = 'test-tool-call-id';
    const output = 'Tool execution completed successfully';
    
    useStore.getState().addMessage({
      author: 'agent',
      chunks: [
        {
          kind: 'tool-execution',
          toolCallId,
          toolName: 'test_tool',
          toolArgs: { arg1: 'value1' },
          status: 'running',
          output: '',
        },
      ],
    });

    useStore.getState().updateToolExecution(toolCallId, 'success', output);

    const { messages } = useStore.getState();
    const lastMessage = messages[messages.length - 1];
    const updatedChunk = lastMessage.chunks[0];
    
    expect(updatedChunk.kind).toBe('tool-execution');
    expect(updatedChunk.status).toBe('success');
    expect(updatedChunk.output).toBe(output);
  });

  it('should set and clear the API key', () => {
    expect(useStore.getState().apiKey).toBeNull();
    
    const testKey = 'sk-test-12345';
    useStore.getState().setApiKey(testKey);
    expect(useStore.getState().apiKey).toBe(testKey);
    
    useStore.getState().clearApiKey();
    expect(useStore.getState().apiKey).toBeNull();
  });

  it('should set and get model configuration', () => {
    const newConfig = { name: 'openai/gpt-4', effort: 'high' };
    
    useStore.getState().setModelConfig(newConfig);
    expect(useStore.getState().modelConfig).toEqual(newConfig);
  });

  it('should manage busy state', () => {
    expect(useStore.getState().busy).toBe(false);
    
    useStore.getState().setBusy(true);
    expect(useStore.getState().busy).toBe(true);
    
    useStore.getState().setBusy(false);
    expect(useStore.getState().busy).toBe(false);
  });

  it('should toggle blink state', () => {
    const initialBlink = useStore.getState().blink;
    
    useStore.getState().toggleBlink();
    expect(useStore.getState().blink).toBe(!initialBlink);
    
    useStore.getState().toggleBlink();
    expect(useStore.getState().blink).toBe(initialBlink);
  });
});

