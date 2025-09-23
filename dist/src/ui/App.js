import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
/** ---------- Utilities ---------- */
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const useBlink = () => {
    const [on, setOn] = useState(true);
    useEffect(() => {
        const id = setInterval(() => setOn(v => !v), 600);
        return () => clearInterval(id);
    }, []);
    return on;
};
/** ---------- Presentational bits ---------- */
const HeaderBar = ({ title }) => {
    return (_jsxs(Box, { borderStyle: "single", paddingX: 1, justifyContent: "space-between", width: "100%", children: [_jsxs(Text, { children: [_jsx(Text, { color: "gray", children: "# " }), _jsx(Text, { bold: true, children: title })] }), _jsx(Text, { dimColor: true, children: "share to create a shareable link" })] }));
};
const Divider = () => (_jsx(Box, { marginY: 0, children: _jsx(Text, { color: "gray", children: '─'.repeat(80) }) }));
const BubblePrefix = ({ author }) => {
    if (author === 'user')
        return _jsx(Text, { color: "cyan", bold: true, children: '> ' });
    if (author === 'agent')
        return _jsx(Text, { color: "green", bold: true, children: '✦ ' });
    return _jsx(Text, { color: "magenta", bold: true, children: '• ' });
};
const CodeBlock = ({ lines }) => (_jsx(Box, { flexDirection: "column", borderStyle: "round", paddingX: 1, paddingY: 0, marginTop: 1, marginBottom: 1, children: lines.map((l, i) => (_jsx(Text, { color: "gray", children: l }, i))) }));
const ErrorLine = ({ text }) => (_jsxs(Text, { color: "redBright", children: ["Error: ", text] }));
const StatusLine = ({ text }) => (_jsxs(Text, { children: [_jsx(Text, { dimColor: true, children: "Generating... " }), _jsx(Text, { children: text }), _jsxs(Text, { dimColor: true, children: [" (", nowTime(), ")"] })] }));
const MessageView = ({ msg }) => (_jsx(Box, { flexDirection: "column", marginTop: 1, children: msg.chunks.map((c, i) => {
        if (c.kind === 'divider')
            return _jsx(Divider, {}, i);
        if (c.kind === 'code')
            return _jsx(CodeBlock, { lines: c.lines ?? [] }, i);
        if (c.kind === 'error')
            return _jsx(ErrorLine, { text: c.text ?? '' }, i);
        if (c.kind === 'status')
            return _jsx(StatusLine, { text: c.text ?? '' }, i);
        if (c.kind === 'list')
            return (_jsx(CodeBlock, { lines: c.lines ?? [] }, i));
        // 'text'
        return (_jsxs(Box, { flexDirection: "row", children: [_jsx(BubblePrefix, { author: msg.author }), _jsx(Text, { children: c.text }), msg.timestamp ? (_jsxs(Text, { dimColor: true, children: [" (", msg.timestamp, ")"] })) : null] }, i));
    }) }));
const Footer = ({ working }) => {
    const blink = useBlink();
    return (_jsxs(Box, { width: "100%", marginTop: 1, justifyContent: "space-between", alignItems: "center", children: [_jsxs(Text, { dimColor: true, children: [working ? (blink ? 'working..' : 'working.') : '', working ? '   ' : '', _jsx(Text, { dimColor: true, children: "esc" }), " ", _jsx(Text, { children: " interrupt" })] }), _jsx(Text, { dimColor: true, children: "opencode v0.11.1  ~" }), _jsxs(Text, { children: [_jsx(Text, { dimColor: true, children: "tab | " }), _jsx(Text, { bold: true, children: "BUILD AGENT" })] })] }));
};
/** ---------- Main App ---------- */
export const App = () => {
    const { exit } = useApp();
    const [title, setTitle] = useState('Implementing coin change in Python');
    const [messages, setMessages] = useState([
        {
            author: 'system',
            chunks: [{ kind: 'text', text: 'Welcome to Coda! How can I help you today?' }],
        },
    ]);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const scrollRef = useRef(0); // placeholder to keep React happy (Ink doesn’t scroll yet)
    useInput((input, key) => {
        if (key.escape)
            exit();
    });
    const push = useCallback((m) => {
        setMessages(prev => [...prev, m]);
    }, []);
    const demoTranscript = useCallback((originalPrompt) => {
        // Header context
        setTitle('Implementing coin change in Python');
        // 1) user asks
        push({
            author: 'user',
            timestamp: nowTime(),
            chunks: [{ kind: 'text', text: 'write a python implementation for coin change' }],
        });
        // 2) "Write coin_change.py" + code
        push({
            author: 'agent',
            chunks: [{ kind: 'text', text: 'Write coin_change.py' }],
        });
        push({
            author: 'agent',
            chunks: [
                {
                    kind: 'code',
                    lines: [
                        'def coin_change(coins, amount):',
                        '    if amount == 0:',
                        "        return 0",
                        "    dp = [float('inf')] * (amount + 1)",
                        '    dp[0] = 0',
                        '    for coin in coins:',
                        '        for i in range(coin, amount + 1):',
                        '            dp[i] = min(dp[i], dp[i - coin] + 1)',
                        "    return dp[amount] if dp[amount] != float('inf') else -1",
                    ],
                },
            ],
        });
        // 3) error message like in screenshot
        push({
            author: 'agent',
            chunks: [
                {
                    kind: 'error',
                    text: 'You must read the file /Users/johannes.duplessis/coin_change.py before overwriting it. Use the Read tool first',
                },
            ],
        });
        // 4) "List /Users/..." with directory listing
        push({
            author: 'agent',
            chunks: [
                { kind: 'text', text: 'List /Users/johannes.duplessis' },
                {
                    kind: 'list',
                    lines: [
                        '',
                        '/Users/johannes.duplessis/',
                        '  .azure/',
                        '  bin/',
                        '  bicep',
                        '  logs/',
                        '    telemetry.log',
                        '  az.json',
                        '  az.sess',
                        '  az_survey.json',
                        '  azureProfile.json',
                        '',
                    ],
                },
            ],
        });
        // 5) Status line
        push({
            author: 'agent',
            chunks: [{ kind: 'status', text: 'Build grok-code' }],
        });
        // 6) Prompt returns
        setBusy(false);
    }, [push]);
    const handleSubmit = useCallback((value) => {
        if (!value.trim())
            return;
        if (value.trim().toLowerCase() === '/quit' || value.trim().toLowerCase() === '/exit') {
            push({ author: 'system', chunks: [{ kind: 'text', text: 'Goodbye!' }] });
            setTimeout(() => exit(), 100);
            return;
        }
        setQuery('');
        setBusy(true);
        // For the demo we recreate the screenshot when the prompt mentions coin change or when "/demo"
        const normalized = value.trim().toLowerCase();
        const shouldDemo = normalized.includes('coin change') || normalized === '/demo';
        if (shouldDemo) {
            // simulate a tiny delay to let spinner show
            setTimeout(() => demoTranscript(value), 400);
            return;
        }
        // Fallback: simple echo conversation bubble
        push({
            author: 'user',
            timestamp: nowTime(),
            chunks: [{ kind: 'text', text: value }],
        });
        setTimeout(() => {
            push({
                author: 'agent',
                chunks: [{ kind: 'text', text: `This is a dummy response to: "${value}"` }],
            });
            setBusy(false);
        }, 600);
    }, [demoTranscript, exit, push]);
    // keep the cursor near bottom on updates (visual nicety)
    useEffect(() => {
        scrollRef.current++;
    }, [messages.length]);
    const leftPrompt = useMemo(() => (_jsx(Box, { children: _jsxs(Text, { color: "cyan", bold: true, children: ['>', ' '] }) })), []);
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [_jsx(HeaderBar, { title: title }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: messages.map((m, i) => (_jsx(MessageView, { msg: m }, i))) }), busy && (_jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: "green", children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { children: " Coda is thinking..." })] })), !busy && (_jsxs(Box, { marginTop: 1, alignItems: "center", children: [leftPrompt, _jsx(TextInput, { value: query, onChange: setQuery, onSubmit: handleSubmit, placeholder: " Ask Coda anything..." })] })), _jsx(Footer, { working: busy })] }));
};
