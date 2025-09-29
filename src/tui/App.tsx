import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { HeaderBar } from './components/HeaderBar.js';
import { MessageView } from './components/MessageView.js';
import { Footer } from './components/Footer.js';
import { PromptBar } from './components/PromptBar.js';
import { useAppState } from './hooks/useAppState.js';

export const App = () => {
  const appState = useAppState();

  return (
    <Box flexDirection="column" width={appState.cols} flexGrow={1}>
      <HeaderBar mode={appState.mode} modelConfig={appState.currentModel} />
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {appState.messages.map((message, index) => (
          <MessageView key={index} msg={message} />
        ))}
        {appState.busy && (
          <Box marginTop={1}>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text> {appState.busyText}</Text>
          </Box>
        )}
      </Box>
      {!appState.busy && (
        <PromptBar
            query={appState.query}
          onChange={appState.onChange}
          onSubmit={appState.onSubmit}
          showCommandMenu={appState.showCommandMenu}
          filteredCommands={appState.filteredCommands}
          commandSelectionIndex={appState.commandSelectionIndex}
          showFileSearchMenu={appState.showFileSearchMenu}
          fileSearchMatches={appState.fileSearchMatches}
          fileSearchSelectionIndex={appState.fileSearchSelectionIndex}
          showModelMenu={appState.showModelMenu}
          filteredModels={appState.filteredModels}
          modelSelectionIndex={appState.modelSelectionIndex}
          currentModelId={appState.currentModelId}
        />
      )}
      <Footer working={appState.busy} mode={appState.mode} />
    </Box>
  );
};
