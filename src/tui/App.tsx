import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { HeaderBar } from './components/HeaderBar.js';
import { MessageView } from './components/MessageView.js';
import { Footer } from './components/Footer.js';
import { PromptBar } from './components/PromptBar.js';
import { useAppState } from './hooks/useAppState.js';


export const App = () => {
  const c = useAppState();

  return (
    <Box flexDirection="column" width={c.cols} flexGrow={1}>
      <HeaderBar title="AI-Powered Development Assistant" mode={c.mode} modelConfig={c.currentModel} />
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {c.messages.map((message, index) => (
          <MessageView key={index} msg={message} />
        ))}
        {c.busy && (
          <Box marginTop={1}>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text> {c.busyText}</Text>
          </Box>
        )}
      </Box>
      {!c.busy && (
        <PromptBar
          query={c.query}
          onChange={c.onChange}
          onSubmit={c.onSubmit}
          showCommandMenu={c.showCommandMenu}
          filteredCommands={c.filteredCommands}
          commandSelectionIndex={c.commandSelectionIndex}
          showFileSearchMenu={c.showFileSearchMenu}
          fileSearchMatches={c.fileSearchMatches}
          fileSearchSelectionIndex={c.fileSearchSelectionIndex}
          showModelMenu={c.showModelMenu}
          filteredModels={c.filteredModels}
          modelSelectionIndex={c.modelSelectionIndex}
          currentModelId={c.currentModelId}
        />
      )}
      <Footer working={c.busy} mode={c.mode} />
    </Box>
  );
};
