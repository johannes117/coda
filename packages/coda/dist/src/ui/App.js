import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
/**
 * A component to display the conversation history.
 */
const History = ({ messages }) => (_jsx(Box, { flexDirection: "column", children: messages.map((msg, index) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: msg.sender === 'user' ? 'cyan' : 'green', bold: true, children: msg.sender === 'user' ? '> ' : '✦ ' }), _jsx(Text, { children: msg.text })] }, index))) }));
/**
 * The main application component for the Coda CLI.
 */
export const App = () => {
    const [messages, setMessages] = useState([
        { sender: 'system', text: 'Welcome to Coda! How can I help you today?' },
    ]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { exit } = useApp();
    const addMessage = useCallback((message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
    }, []);
    const handleSubmit = useCallback((value) => {
        if (!value.trim())
            return;
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
    }, [addMessage, exit]);
    useEffect(() => {
        const handleCtrlC = (_, key) => {
            if (key.ctrl && key.name === 'c') {
                exit();
            }
        };
        process.stdin.on('keypress', handleCtrlC);
        return () => {
            process.stdin.removeListener('keypress', handleCtrlC);
        };
    }, [exit]);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, borderStyle: "round", children: [_jsx(History, { messages: messages }), isLoading && (_jsxs(Box, { children: [_jsx(Text, { color: "green", children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { children: " Coda is thinking..." })] })), !isLoading && (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", bold: true, children: '>' }), _jsx(TextInput, { value: query, onChange: setQuery, onSubmit: handleSubmit, placeholder: " Ask Coda anything..." })] }))] }));
};
