import { render } from 'ink';
import { App } from './tui/App.js';
import { getStoredApiKeys, deleteAllApiKeys, getStoredModelConfig } from '@lib/storage';
import { clearLog } from '@lib/logger';
import { useStore } from '@app/store.js';

export async function main() {
  await clearLog();

  const storedModelConfig = await getStoredModelConfig();
  if (storedModelConfig) {
    useStore.setState({ modelConfig: storedModelConfig });
  }

  const storedApiKeys = await getStoredApiKeys();
  useStore.setState({ apiKeys: storedApiKeys });

  let running = true;
  while (running) {

    const updateSize = () => {
      useStore.setState({ terminalCols: process.stdout.columns ?? 80 });
    };
    process.stdout.on('resize', updateSize);
    updateSize();

    const blinkInterval = setInterval(() => {
      const { busy, toggleBlink } = useStore.getState();
      if (busy) {
        toggleBlink();
      }
    }, 600);

    const instance = render(<App />);
    try {
      await instance.waitUntilExit();
    } finally {
      clearInterval(blinkInterval);
      process.stdout.removeListener('resize', updateSize);
    }

    const resetRequested = useStore.getState().resetRequested;
    if (resetRequested) {
      useStore.setState({
        resetRequested: false,
        apiKeys: {},
        messages: [],
      });
      await deleteAllApiKeys();
    } else {
      running = false;
    }
  }
}
