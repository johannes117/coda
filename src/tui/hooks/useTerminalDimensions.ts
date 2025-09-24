import { useEffect, useState } from 'react';
import { useStdout } from 'ink';

export const useTerminalDimensions = (): [number, number] => {
  const { stdout } = useStdout();
  const [size, setSize] = useState<[number, number]>([stdout?.columns ?? 80, stdout?.rows ?? 24]);
  useEffect(() => {
    if (!stdout) return;
    const updateSize = () => {
      setSize([stdout.columns ?? 80, stdout.rows ?? 24]);
    };
    updateSize();
    stdout.on('resize', updateSize);
    return () => {
      stdout.removeListener('resize', updateSize);
    };
  }, [stdout]);
  return size;
};