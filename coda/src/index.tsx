import { render } from '@opentui/react';
import { getTokyoNightColors } from './theme';

const colors = getTokyoNightColors(true); // Dark mode

const App = () => (
  <box
    flexDirection="column"
    height="100%"
    width="100%"
    backgroundColor={colors.bg}
  >
    <box flexDirection="row" flexGrow={1}>
      {/* Sidebar */}
      <box
        width={24}
        flexDirection="column"
        padding={1}
        backgroundColor={colors.bgSecondary}
        border
        borderColor={colors.border}
        borderStyle="single"
      >
        <text fg={colors.primary}>coda v0.1.0</text>
        <text>/new session (ctrl+n)</text>
        <text>/show help (ctrl+h)</text>
        <text>/share session (ctrl+s)</text>
        <text>/models list models (ctrl+m)</text>
        <text>/agents list agents (ctrl+a)</text>
        <text>/editor open editor (ctrl+e)</text>
      </box>

      {/* Main content area */}
      <box flexDirection="column" flexGrow={1} paddingTop={1}>
        {/* Top bar */}
        <box
          height={2}
          paddingLeft={2}
          paddingRight={2}
          flexDirection="row"
          alignItems="center"
          backgroundColor={colors.bgSecondary}
        >
          <text fg={colors.primary}>coda Grok Code Fast 1</text>
        </box>

        {/* Main editor */}
        <box
          flexGrow={1}
          padding={2}
          backgroundColor={colors.bg}
          border
          borderColor={colors.border}
          borderStyle="single"
        >
          <text>Welcome to coda

coda is an AI-powered code editor in your terminal.

Query the model below to generate code, edit files, or build agents.

Press /help for commands.</text>
        </box>
      </box>
    </box>

    {/* Bottom bar */}
    <box
      height={3}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={colors.bgTertiary}
      border
      borderColor={colors.border}
      borderStyle="single"
    >
      <box flexGrow={1} flexDirection="row" alignItems="center">
        <text fg={colors.textMuted}>{'>'}</text>
        <text paddingLeft={1}>enter send</text>
      </box>
      <box flexDirection="row">
        <text fg={colors.accent}>BUILD AGENT</text>
      </box>
    </box>
  </box>
);

render(<App />);
