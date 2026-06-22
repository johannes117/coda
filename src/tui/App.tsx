import { Box } from "ink";
import { Welcome } from "./components/Welcome.js";
import { Message } from "./components/Message.js";
import { PromptInput } from "./components/PromptInput.js";
import { StatusLine } from "./components/StatusLine.js";
import { BusyLine } from "./components/BusyLine.js";
import { useAppState } from "./hooks/useAppState.js";

export const App = () => {
  const appState = useAppState();

  // The vendored renderer diffs at the cell level and lets unchanged earlier
  // rows scroll into terminal history without rewrites, so we render the whole
  // conversation live in one tree. No <Static> — that was a stock-Ink crutch
  // whose scrollback-unaware erase caused the growing-gap glitch.
  return (
    <Box flexDirection="column">
      <Welcome modelConfig={appState.currentModel} />

      {appState.messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {appState.busy ? <BusyLine label={appState.busyText} /> : null}

      <Box marginTop={1} flexDirection="column">
        <PromptInput
          query={appState.query}
          onChange={appState.onChange}
          onSubmit={appState.onSubmit}
          cursorOffset={appState.cursorOffset}
          onChangeCursorOffset={appState.onChangeCursorOffset}
          onPaste={appState.onPaste}
          onImagePaste={appState.onImagePaste}
          onExit={appState.onExit}
          inputFilter={appState.inputFilter}
          columns={appState.cols}
          mode={appState.mode}
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
          showApiKeysMenu={appState.showApiKeysMenu}
          apiKeyItems={appState.apiKeyItems}
          apiKeysSelectionIndex={appState.apiKeysSelectionIndex}
        />
        <StatusLine />
      </Box>
    </Box>
  );
};
